package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"github.com/arturbaldoramos/Habitta/pkg/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreateInviteRequest represents the request to create a new invite
type CreateInviteRequest struct {
	Email string          `json:"email" binding:"required,email"`
	Role  models.UserRole `json:"role" binding:"required,oneof=admin sindico morador"`
}

// AcceptInviteRequest represents the request to accept an invite
type AcceptInviteRequest struct {
	Name     string `json:"name"`     // Required if user doesn't exist
	Password string `json:"password"` // Required if user doesn't exist
	Phone    string `json:"phone"`
	CPF      string `json:"cpf"`
}

// InviteService defines the interface for invite operations
type InviteService interface {
	CreateInvite(tenantID, inviterUserID uint, req CreateInviteRequest) (*models.Invite, error)
	GetInviteByToken(token string) (*models.Invite, error)
	AcceptInvite(token string, req AcceptInviteRequest) (*models.User, error)
	GetPendingInvitesByEmail(email string) ([]models.Invite, error)
	CancelInvite(inviteID, userID, tenantID uint) error
	GetTenantInvites(tenantID uint) ([]models.Invite, error)
}

// inviteService implements InviteService
type inviteService struct {
	inviteRepo     repositories.InviteRepository
	userRepo       repositories.UserRepository
	userTenantRepo repositories.UserTenantRepository
	db             *gorm.DB
}

// NewInviteService creates a new invite service
func NewInviteService(
	inviteRepo repositories.InviteRepository,
	userRepo repositories.UserRepository,
	userTenantRepo repositories.UserTenantRepository,
	db *gorm.DB,
) InviteService {
	return &inviteService{
		inviteRepo:     inviteRepo,
		userRepo:       userRepo,
		userTenantRepo: userTenantRepo,
		db:             db,
	}
}

// CreateInvite creates a new invite (only síndico or admin can invite)
func (s *inviteService) CreateInvite(tenantID, inviterUserID uint, req CreateInviteRequest) (*models.Invite, error) {
	// Verify inviter has permission (síndico or admin)
	userTenant, err := s.userTenantRepo.GetByUserAndTenant(inviterUserID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user does not belong to this tenant")
		}
		return nil, fmt.Errorf("failed to verify user tenant: %w", err)
	}

	if userTenant.Role != models.RoleSindico && userTenant.Role != models.RoleAdmin {
		return nil, errors.New("only síndico or admin can create invites")
	}

	// Check if email already belongs to this tenant
	belongsToTenant, err := s.userTenantRepo.UserBelongsToTenant(inviterUserID, tenantID)
	if err == nil && belongsToTenant {
		return nil, errors.New("user already belongs to this tenant")
	}

	// Check if there's already a pending invite for this email and tenant
	pendingInvites, err := s.inviteRepo.GetPendingByEmail(req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check pending invites: %w", err)
	}

	for _, invite := range pendingInvites {
		if invite.TenantID == tenantID && invite.IsValid() {
			return nil, errors.New("pending invite already exists for this email and tenant")
		}
	}

	// Create invite
	invite := &models.Invite{
		TenantID:        tenantID,
		Email:           req.Email,
		Role:            req.Role,
		Token:           uuid.New().String(),
		Status:          models.InviteStatusPending,
		InvitedByUserID: inviterUserID,
		ExpiresAt:       time.Now().Add(7 * 24 * time.Hour), // Expires in 7 days
	}

	if err := s.inviteRepo.Create(invite); err != nil {
		return nil, fmt.Errorf("failed to create invite: %w", err)
	}

	// Reload invite with relationships
	invite, err = s.inviteRepo.GetByToken(invite.Token)
	if err != nil {
		return nil, fmt.Errorf("failed to reload invite: %w", err)
	}

	return invite, nil
}

// GetInviteByToken retrieves an invite by token
func (s *inviteService) GetInviteByToken(token string) (*models.Invite, error) {
	invite, err := s.inviteRepo.GetByToken(token)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invite not found")
		}
		return nil, fmt.Errorf("failed to get invite: %w", err)
	}

	return invite, nil
}

// AcceptInvite accepts an invite and creates user-tenant relationship
func (s *inviteService) AcceptInvite(token string, req AcceptInviteRequest) (*models.User, error) {
	// Get invite
	invite, err := s.inviteRepo.GetByToken(token)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invite not found")
		}
		return nil, fmt.Errorf("failed to get invite: %w", err)
	}

	// Validate invite
	if !invite.IsValid() {
		if invite.Status != models.InviteStatusPending {
			return nil, fmt.Errorf("invite is %s", invite.Status)
		}
		return nil, errors.New("invite has expired")
	}

	var user *models.User

	// Use transaction to ensure atomicity
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Check if user exists
		existingUser, err := s.userRepo.GetByEmail(invite.Email)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("failed to check existing user: %w", err)
		}

		if existingUser != nil {
			// User exists - just create user-tenant relationship
			user = existingUser

			// Verify user doesn't already belong to this tenant
			belongsToTenant, err := s.userTenantRepo.UserBelongsToTenant(user.ID, invite.TenantID)
			if err != nil {
				return fmt.Errorf("failed to check tenant membership: %w", err)
			}
			if belongsToTenant {
				return errors.New("user already belongs to this tenant")
			}
		} else {
			// User doesn't exist - create new user
			if req.Name == "" || req.Password == "" {
				return errors.New("name and password are required for new users")
			}

			// Validate password
			if err := utils.IsPasswordValid(req.Password); err != nil {
				return err
			}

			// Hash password
			hashedPassword, err := utils.HashPassword(req.Password)
			if err != nil {
				return fmt.Errorf("failed to hash password: %w", err)
			}

			user = &models.User{
				Email:    invite.Email,
				Password: hashedPassword,
				Name:     req.Name,
				Phone:    req.Phone,
				CPF:      req.CPF,
				Active:   true,
			}

			if err := tx.Create(user).Error; err != nil {
				return fmt.Errorf("failed to create user: %w", err)
			}
		}

		// Create user-tenant relationship
		userTenant := &models.UserTenant{
			UserID:   user.ID,
			TenantID: invite.TenantID,
			Role:     invite.Role,
			IsActive: true,
			JoinedAt: time.Now(),
		}

		if err := tx.Create(userTenant).Error; err != nil {
			return fmt.Errorf("failed to create user-tenant relationship: %w", err)
		}

		// Mark invite as accepted
		now := time.Now()
		invite.Status = models.InviteStatusAccepted
		invite.AcceptedByUserID = &user.ID
		invite.AcceptedAt = &now

		if err := tx.Save(invite).Error; err != nil {
			return fmt.Errorf("failed to update invite: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Remove password from response
	user.Password = ""

	return user, nil
}

// GetPendingInvitesByEmail retrieves pending invites for an email
func (s *inviteService) GetPendingInvitesByEmail(email string) ([]models.Invite, error) {
	invites, err := s.inviteRepo.GetPendingByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending invites: %w", err)
	}

	// Filter out expired invites
	validInvites := []models.Invite{}
	for _, invite := range invites {
		if invite.IsValid() {
			validInvites = append(validInvites, invite)
		}
	}

	return validInvites, nil
}

// CancelInvite cancels an invite (only inviter, síndico, or admin can cancel)
func (s *inviteService) CancelInvite(inviteID, userID, tenantID uint) error {
	// Get invite
	invite, err := s.inviteRepo.GetByID(inviteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invite not found")
		}
		return fmt.Errorf("failed to get invite: %w", err)
	}

	// Verify invite belongs to the tenant
	if invite.TenantID != tenantID {
		return errors.New("invite does not belong to this tenant")
	}

	// Verify user has permission (inviter, síndico, or admin)
	userTenant, err := s.userTenantRepo.GetByUserAndTenant(userID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user does not belong to this tenant")
		}
		return fmt.Errorf("failed to verify user tenant: %w", err)
	}

	isInviter := invite.InvitedByUserID == userID
	isAdminOrSindico := userTenant.Role == models.RoleAdmin || userTenant.Role == models.RoleSindico

	if !isInviter && !isAdminOrSindico {
		return errors.New("only the inviter, síndico, or admin can cancel invites")
	}

	// Mark invite as cancelled
	invite.Status = models.InviteStatusCancelled
	if err := s.inviteRepo.Update(invite); err != nil {
		return fmt.Errorf("failed to cancel invite: %w", err)
	}

	return nil
}

// GetTenantInvites retrieves all invites for a tenant
func (s *inviteService) GetTenantInvites(tenantID uint) ([]models.Invite, error) {
	invites, err := s.inviteRepo.GetByTenant(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant invites: %w", err)
	}

	return invites, nil
}
