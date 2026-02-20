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
// NOTE: This service needs refactoring to work with multi-tenant architecture
// Most methods are deprecated and should use UserTenantRepository instead
type UserService interface {
	GetByID(userID uint) (*models.User, error)
	Update(user *models.User) error
	UpdatePassword(userID uint, oldPassword, newPassword string) error
	Delete(userID uint) error
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

// Delete soft deletes a user
func (s *userService) Delete(userID uint) error {
	// Validate user exists
	_, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Delete user
	if err := s.userRepo.Delete(userID); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}
