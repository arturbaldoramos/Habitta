package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// UserRepository defines the interface for user operations
type UserRepository interface {
	Create(user *models.User) error
	GetByID(userID uint) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetByEmailWithTenants(email string) (*models.User, error)
	Update(user *models.User) error
	Delete(userID uint) error
}

// userRepository implements UserRepository
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create creates a new user
func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// GetByID retrieves a user by ID
func (r *userRepository) GetByID(userID uint) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ?", userID).
		Preload("Unit").
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).
		Preload("Unit").
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmailWithTenants retrieves a user by email with all their tenants preloaded
func (r *userRepository) GetByEmailWithTenants(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).
		Preload("UserTenants").
		Preload("UserTenants.Tenant").
		Preload("Tenants").
		Preload("Unit").
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update updates a user
func (r *userRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

// Delete soft deletes a user
func (r *userRepository) Delete(userID uint) error {
	return r.db.Delete(&models.User{}, userID).Error
}
