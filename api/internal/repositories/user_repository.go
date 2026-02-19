package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// UserRepository defines the interface for user operations
type UserRepository interface {
	Create(user *models.User) error
	GetByID(tenantID, userID uint) (*models.User, error)
	GetByEmail(tenantID uint, email string) (*models.User, error)
	GetAll(tenantID uint) ([]models.User, error)
	GetByTenantAndRole(tenantID uint, role models.UserRole) ([]models.User, error)
	Update(user *models.User) error
	Delete(tenantID, userID uint) error
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

// GetByID retrieves a user by ID with tenant isolation
func (r *userRepository) GetByID(tenantID, userID uint) (*models.User, error) {
	var user models.User
	err := r.db.Where("tenant_id = ? AND id = ?", tenantID, userID).
		Preload("Tenant").
		Preload("Unit").
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmail retrieves a user by email with tenant isolation
func (r *userRepository) GetByEmail(tenantID uint, email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("tenant_id = ? AND email = ?", tenantID, email).
		Preload("Tenant").
		Preload("Unit").
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetAll retrieves all users for a tenant
func (r *userRepository) GetAll(tenantID uint) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("tenant_id = ?", tenantID).
		Preload("Unit").
		Find(&users).Error
	return users, err
}

// GetByTenantAndRole retrieves users by tenant and role
func (r *userRepository) GetByTenantAndRole(tenantID uint, role models.UserRole) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("tenant_id = ? AND role = ?", tenantID, role).
		Preload("Unit").
		Find(&users).Error
	return users, err
}

// Update updates a user (validates tenant_id to prevent cross-tenant updates)
func (r *userRepository) Update(user *models.User) error {
	// Ensure we only update the user belonging to the correct tenant
	return r.db.Model(&models.User{}).
		Where("tenant_id = ? AND id = ?", user.TenantID, user.ID).
		Updates(user).Error
}

// Delete soft deletes a user with tenant isolation
func (r *userRepository) Delete(tenantID, userID uint) error {
	return r.db.Where("tenant_id = ? AND id = ?", tenantID, userID).
		Delete(&models.User{}).Error
}
