package services

import (
	"errors"
	"fmt"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"github.com/arturbaldoramos/Habitta/pkg/utils"
	"gorm.io/gorm"
)

// UserService defines the interface for user operations
type UserService interface {
	Create(user *models.User) error
	GetByID(tenantID, userID uint) (*models.User, error)
	GetByEmail(tenantID uint, email string) (*models.User, error)
	GetAll(tenantID uint) ([]models.User, error)
	GetByRole(tenantID uint, role models.UserRole) ([]models.User, error)
	Update(user *models.User) error
	UpdatePassword(tenantID, userID uint, oldPassword, newPassword string) error
	Delete(tenantID, userID uint) error
}

// userService implements UserService
type userService struct {
	userRepo   repositories.UserRepository
	tenantRepo repositories.TenantRepository
}

// NewUserService creates a new user service
func NewUserService(
	userRepo repositories.UserRepository,
	tenantRepo repositories.TenantRepository,
) UserService {
	return &userService{
		userRepo:   userRepo,
		tenantRepo: tenantRepo,
	}
}

// Create creates a new user with validation
func (s *userService) Create(user *models.User) error {
	// Validate tenant exists and is active
	tenant, err := s.tenantRepo.GetByID(user.TenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("tenant not found")
		}
		return fmt.Errorf("failed to get tenant: %w", err)
	}

	if !tenant.Active {
		return errors.New("tenant is inactive")
	}

	// Validate required fields
	if user.Email == "" {
		return errors.New("email is required")
	}

	if user.Name == "" {
		return errors.New("name is required")
	}

	if user.Password == "" {
		return errors.New("password is required")
	}

	// Validate password
	if err := utils.IsPasswordValid(user.Password); err != nil {
		return err
	}

	// Check if email already exists for this tenant
	existingUser, err := s.userRepo.GetByEmail(user.TenantID, user.Email)
	if err == nil && existingUser != nil {
		return errors.New("email already registered for this tenant")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	user.Password = hashedPassword

	// Set default values
	if user.Role == "" {
		user.Role = models.RoleMorador
	}
	user.Active = true

	// Create user
	if err := s.userRepo.Create(user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return nil
}

// GetByID retrieves a user by ID with tenant isolation
func (s *userService) GetByID(tenantID, userID uint) (*models.User, error) {
	user, err := s.userRepo.GetByID(tenantID, userID)
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

// GetByEmail retrieves a user by email with tenant isolation
func (s *userService) GetByEmail(tenantID uint, email string) (*models.User, error) {
	if email == "" {
		return nil, errors.New("email is required")
	}

	user, err := s.userRepo.GetByEmail(tenantID, email)
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

// GetAll retrieves all users for a tenant
func (s *userService) GetAll(tenantID uint) ([]models.User, error) {
	users, err := s.userRepo.GetAll(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	// Remove passwords from response
	for i := range users {
		users[i].Password = ""
	}

	return users, nil
}

// GetByRole retrieves users by role for a tenant
func (s *userService) GetByRole(tenantID uint, role models.UserRole) ([]models.User, error) {
	users, err := s.userRepo.GetByTenantAndRole(tenantID, role)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	// Remove passwords from response
	for i := range users {
		users[i].Password = ""
	}

	return users, nil
}

// Update updates a user (excluding password)
func (s *userService) Update(user *models.User) error {
	// Validate user exists
	existing, err := s.userRepo.GetByID(user.TenantID, user.ID)
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
		existingWithEmail, err := s.userRepo.GetByEmail(user.TenantID, user.Email)
		if err == nil && existingWithEmail != nil && existingWithEmail.ID != user.ID {
			return errors.New("email already registered for this tenant")
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
func (s *userService) UpdatePassword(tenantID, userID uint, oldPassword, newPassword string) error {
	// Get user
	user, err := s.userRepo.GetByID(tenantID, userID)
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

// Delete soft deletes a user with tenant isolation
func (s *userService) Delete(tenantID, userID uint) error {
	// Validate user exists
	_, err := s.userRepo.GetByID(tenantID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Delete user
	if err := s.userRepo.Delete(tenantID, userID); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}
