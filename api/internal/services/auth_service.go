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
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	TenantID uint   `json:"tenant_id" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=admin sindico morador"`
	Phone    string `json:"phone"`
	CPF      string `json:"cpf"`
}

// AuthService defines the interface for authentication operations
type AuthService interface {
	Login(req LoginRequest) (*LoginResponse, error)
	LoginWithTenant(tenantID uint, email, password string) (*LoginResponse, error)
	Register(req RegisterRequest) (*models.User, error)
}

// authService implements AuthService
type authService struct {
	userRepo   repositories.UserRepository
	tenantRepo repositories.TenantRepository
	config     *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(
	userRepo repositories.UserRepository,
	tenantRepo repositories.TenantRepository,
	config *config.Config,
) AuthService {
	return &authService{
		userRepo:   userRepo,
		tenantRepo: tenantRepo,
		config:     config,
	}
}

// Login authenticates a user and returns a JWT token
func (s *authService) Login(req LoginRequest) (*LoginResponse, error) {
	// For login, we need to find the user across all tenants first
	// In a real-world scenario, you might want to include tenant identifier in login
	// For now, we'll search by email and get the first match

	// This is a simplified approach - in production you might want to:
	// 1. Use subdomain to identify tenant
	// 2. Require tenant_id in login
	// 3. Use a separate login endpoint per tenant

	// For MVP, we'll need to implement a GetByEmailGlobal method
	// For now, let's assume we have tenant_id from somewhere (e.g., subdomain)
	// This is a limitation we'll note in the TODO

	return nil, errors.New("login requires tenant identification - implement subdomain or tenant_id selection")
}

// LoginWithTenant authenticates a user within a specific tenant
func (s *authService) LoginWithTenant(tenantID uint, email, password string) (*LoginResponse, error) {
	// Get user by email and tenant
	user, err := s.userRepo.GetByEmail(tenantID, email)
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

	// Generate JWT token
	token, err := utils.GenerateJWT(
		user.ID,
		user.TenantID,
		user.Email,
		string(user.Role),
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

// Register creates a new user account
func (s *authService) Register(req RegisterRequest) (*models.User, error) {
	// Validate password
	if err := utils.IsPasswordValid(req.Password); err != nil {
		return nil, err
	}

	// Check if tenant exists and is active
	tenant, err := s.tenantRepo.GetByID(req.TenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("tenant not found")
		}
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	if !tenant.Active {
		return nil, errors.New("tenant is inactive")
	}

	// Check if email already exists for this tenant
	existingUser, err := s.userRepo.GetByEmail(req.TenantID, req.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("email already registered for this tenant")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		TenantID: req.TenantID,
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
		Role:     models.UserRole(req.Role),
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
