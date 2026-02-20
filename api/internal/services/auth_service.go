package services

import (
	"errors"
	"fmt"

	"github.com/arturbaldoramos/Habitta/internal/config"
	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"github.com/arturbaldoramos/Habitta/pkg/utils"
	"gorm.io/gorm"
)

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token   string                 `json:"token,omitempty"`
	User    *models.User           `json:"user"`
	Tenants []TenantSelectionInfo  `json:"tenants,omitempty"`
}

// TenantSelectionInfo represents tenant selection information for multi-tenant users
type TenantSelectionInfo struct {
	TenantID   uint             `json:"tenant_id"`
	TenantName string           `json:"tenant_name"`
	Role       models.UserRole  `json:"role"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone"`
	CPF      string `json:"cpf"`
}

// AuthService defines the interface for authentication operations
type AuthService interface {
	Login(req LoginRequest) (*LoginResponse, error)
	LoginWithTenant(email, password string, tenantID uint) (*LoginResponse, error)
	Register(req RegisterRequest) (*models.User, error)
	SwitchTenant(userID, tenantID uint) (string, error)
}

// authService implements AuthService
type authService struct {
	userRepo       repositories.UserRepository
	userTenantRepo repositories.UserTenantRepository
	tenantRepo     repositories.TenantRepository
	config         *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(
	userRepo repositories.UserRepository,
	userTenantRepo repositories.UserTenantRepository,
	tenantRepo repositories.TenantRepository,
	config *config.Config,
) AuthService {
	return &authService{
		userRepo:       userRepo,
		userTenantRepo: userTenantRepo,
		tenantRepo:     tenantRepo,
		config:         config,
	}
}

// Login authenticates a user and returns appropriate response based on tenant count
func (s *authService) Login(req LoginRequest) (*LoginResponse, error) {
	// Get user by email with all tenants
	user, err := s.userRepo.GetByEmailWithTenants(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.Active {
		return nil, errors.New("user account is inactive")
	}

	// Validate password
	if err := utils.CheckPassword(req.Password, user.Password); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Remove password from response
	user.Password = ""

	// Get active user tenants
	activeTenants := []models.UserTenant{}
	for _, ut := range user.UserTenants {
		if ut.IsActive {
			activeTenants = append(activeTenants, ut)
		}
	}

	// Case 1: User has no tenants (orphan user)
	if len(activeTenants) == 0 {
		token, err := utils.GenerateJWT(
			user.ID,
			user.Email,
			nil, // no active tenant
			"",
			s.config.JWT.Secret,
			s.config.JWT.ExpirationHours,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to generate token: %w", err)
		}

		return &LoginResponse{
			Token: token,
			User:  user,
		}, nil
	}

	// Case 2: User has exactly one tenant
	if len(activeTenants) == 1 {
		tenantID := activeTenants[0].TenantID
		role := activeTenants[0].Role

		token, err := utils.GenerateJWT(
			user.ID,
			user.Email,
			&tenantID,
			string(role),
			s.config.JWT.Secret,
			s.config.JWT.ExpirationHours,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to generate token: %w", err)
		}

		return &LoginResponse{
			Token: token,
			User:  user,
		}, nil
	}

	// Case 3: User has multiple tenants - return tenant selection list
	tenantSelections := []TenantSelectionInfo{}
	for _, ut := range activeTenants {
		if ut.Tenant != nil {
			tenantSelections = append(tenantSelections, TenantSelectionInfo{
				TenantID:   ut.TenantID,
				TenantName: ut.Tenant.Name,
				Role:       ut.Role,
			})
		}
	}

	return &LoginResponse{
		User:    user,
		Tenants: tenantSelections,
	}, nil
}

// LoginWithTenant authenticates a user and sets specific tenant as active
func (s *authService) LoginWithTenant(email, password string, tenantID uint) (*LoginResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.Active {
		return nil, errors.New("user account is inactive")
	}

	// Validate password
	if err := utils.CheckPassword(password, user.Password); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Verify user belongs to the requested tenant
	userTenant, err := s.userTenantRepo.GetByUserAndTenant(user.ID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user does not belong to this tenant")
		}
		return nil, fmt.Errorf("failed to verify tenant access: %w", err)
	}

	if !userTenant.IsActive {
		return nil, errors.New("user access to this tenant is inactive")
	}

	// Generate JWT token with active tenant
	token, err := utils.GenerateJWT(
		user.ID,
		user.Email,
		&tenantID,
		string(userTenant.Role),
		s.config.JWT.Secret,
		s.config.JWT.ExpirationHours,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &LoginResponse{
		Token: token,
		User:  user,
	}, nil
}

// Register creates a new orphan user account (without tenant)
func (s *authService) Register(req RegisterRequest) (*models.User, error) {
	// Validate password
	if err := utils.IsPasswordValid(req.Password); err != nil {
		return nil, err
	}

	// Check if email already exists globally
	existingUser, err := s.userRepo.GetByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("email already registered")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check existing email: %w", err)
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create orphan user (without tenant)
	user := &models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
		Phone:    req.Phone,
		CPF:      req.CPF,
		Active:   true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return user, nil
}

// SwitchTenant generates a new token with a different active tenant
func (s *authService) SwitchTenant(userID, tenantID uint) (string, error) {
	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("user not found")
		}
		return "", fmt.Errorf("failed to get user: %w", err)
	}

	// Verify user belongs to the requested tenant
	userTenant, err := s.userTenantRepo.GetByUserAndTenant(userID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("user does not belong to this tenant")
		}
		return "", fmt.Errorf("failed to verify tenant access: %w", err)
	}

	if !userTenant.IsActive {
		return "", errors.New("user access to this tenant is inactive")
	}

	// Generate new JWT token with new active tenant
	token, err := utils.GenerateJWT(
		user.ID,
		user.Email,
		&tenantID,
		string(userTenant.Role),
		s.config.JWT.Secret,
		s.config.JWT.ExpirationHours,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	return token, nil
}
