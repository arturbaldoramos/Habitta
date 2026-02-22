package services

import (
	"errors"
	"fmt"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"github.com/arturbaldoramos/Habitta/pkg/utils"
	"gorm.io/gorm"
)

// UserInTenant represents combined User + UserTenant data for a specific tenant
type UserInTenant struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
	IsActive bool   `json:"is_active"`
	UnitID   *uint  `json:"unit_id"`
}

// UserService defines the interface for user operations
type UserService interface {
	GetByID(userID uint) (*models.User, error)
	GetByIDInTenant(tenantID, userID uint) (*UserInTenant, error)
	ListByTenant(tenantID uint, page, perPage int, search string) ([]models.UserTenant, int64, error)
	UpdateMembership(tenantID, userID uint, isActive bool, unitID *uint) error
	Update(user *models.User) error
	UpdatePassword(userID uint, oldPassword, newPassword string) error
	RemoveFromTenant(tenantID, userID uint) error
}

// userService implements UserService
type userService struct {
	userRepo       repositories.UserRepository
	tenantRepo     repositories.TenantRepository
	userTenantRepo repositories.UserTenantRepository
}

// NewUserService creates a new user service
func NewUserService(
	userRepo repositories.UserRepository,
	tenantRepo repositories.TenantRepository,
	userTenantRepo repositories.UserTenantRepository,
) UserService {
	return &userService{
		userRepo:       userRepo,
		tenantRepo:     tenantRepo,
		userTenantRepo: userTenantRepo,
	}
}

// ListByTenant retrieves paginated users for a tenant
func (s *userService) ListByTenant(tenantID uint, page, perPage int, search string) ([]models.UserTenant, int64, error) {
	userTenants, total, err := s.userTenantRepo.GetAllByTenantPaginated(tenantID, page, perPage, search)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}

	// Remove password from users
	for i := range userTenants {
		if userTenants[i].User != nil {
			userTenants[i].User.Password = ""
		}
	}

	return userTenants, total, nil
}

// GetByID retrieves a user by ID
func (s *userService) GetByID(userID uint) (*models.User, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return user, nil
}

// GetByIDInTenant retrieves a user with tenant-specific data (role, is_active)
func (s *userService) GetByIDInTenant(tenantID, userID uint) (*UserInTenant, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	userTenant, err := s.userTenantRepo.GetByUserAndTenant(userID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user does not belong to this tenant")
		}
		return nil, fmt.Errorf("failed to get user-tenant: %w", err)
	}

	return &UserInTenant{
		ID:       user.ID,
		Name:     user.Name,
		Email:    user.Email,
		Phone:    user.Phone,
		Role:     string(userTenant.Role),
		IsActive: userTenant.IsActive,
		UnitID:   user.UnitID,
	}, nil
}

// UpdateMembership updates tenant-specific fields: is_active and unit_id
func (s *userService) UpdateMembership(tenantID, userID uint, isActive bool, unitID *uint) error {
	// Validate user belongs to tenant
	_, err := s.userTenantRepo.GetByUserAndTenant(userID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user does not belong to this tenant")
		}
		return fmt.Errorf("failed to get user-tenant: %w", err)
	}

	// Update is_active on user_tenants
	if err := s.userTenantRepo.UpdateIsActive(userID, tenantID, isActive); err != nil {
		return fmt.Errorf("failed to update membership: %w", err)
	}

	// Update unit_id on users
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}
	user.UnitID = unitID
	if err := s.userRepo.Update(user); err != nil {
		return fmt.Errorf("failed to update unit: %w", err)
	}

	return nil
}

// Update updates a user (excluding password)
func (s *userService) Update(user *models.User) error {
	// Validate user exists
	existing, err := s.userRepo.GetByID(user.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Validate required fields
	if user.Email == "" {
		return errors.New("email is required")
	}

	if user.Name == "" {
		return errors.New("name is required")
	}

	// Check if email is being changed and if it's already taken
	if user.Email != existing.Email {
		existingWithEmail, err := s.userRepo.GetByEmail(user.Email)
		if err == nil && existingWithEmail != nil && existingWithEmail.ID != user.ID {
			return errors.New("email already registered")
		}
	}

	// Keep the existing password (don't allow password update through this method)
	user.Password = existing.Password

	// Update user
	if err := s.userRepo.Update(user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// UpdatePassword updates a user's password
func (s *userService) UpdatePassword(userID uint, oldPassword, newPassword string) error {
	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Validate old password
	if err := utils.CheckPassword(oldPassword, user.Password); err != nil {
		return errors.New("invalid old password")
	}

	// Validate new password
	if err := utils.IsPasswordValid(newPassword); err != nil {
		return err
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	user.Password = hashedPassword
	if err := s.userRepo.Update(user); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// RemoveFromTenant removes a user's membership from a tenant (does NOT delete the user account)
func (s *userService) RemoveFromTenant(tenantID, userID uint) error {
	// Validate user belongs to tenant
	_, err := s.userTenantRepo.GetByUserAndTenant(userID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user does not belong to this tenant")
		}
		return fmt.Errorf("failed to get user-tenant: %w", err)
	}

	// Remove user-tenant relationship only
	if err := s.userTenantRepo.Delete(userID, tenantID); err != nil {
		return fmt.Errorf("failed to remove user from tenant: %w", err)
	}

	return nil
}
