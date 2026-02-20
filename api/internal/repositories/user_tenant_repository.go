package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// UserTenantRepository defines the interface for user-tenant relationship operations
type UserTenantRepository interface {
	Create(userTenant *models.UserTenant) error
	GetByUserAndTenant(userID, tenantID uint) (*models.UserTenant, error)
	GetAllByUser(userID uint) ([]models.UserTenant, error)
	GetAllByTenant(tenantID uint) ([]models.UserTenant, error)
	Update(userTenant *models.UserTenant) error
	Delete(userID, tenantID uint) error
	UserBelongsToTenant(userID, tenantID uint) (bool, error)
}

// userTenantRepository implements UserTenantRepository
type userTenantRepository struct {
	db *gorm.DB
}

// NewUserTenantRepository creates a new user-tenant repository
func NewUserTenantRepository(db *gorm.DB) UserTenantRepository {
	return &userTenantRepository{db: db}
}

// Create creates a new user-tenant relationship
func (r *userTenantRepository) Create(userTenant *models.UserTenant) error {
	return r.db.Create(userTenant).Error
}

// GetByUserAndTenant retrieves a user-tenant relationship
func (r *userTenantRepository) GetByUserAndTenant(userID, tenantID uint) (*models.UserTenant, error) {
	var userTenant models.UserTenant
	err := r.db.Where("user_id = ? AND tenant_id = ?", userID, tenantID).
		Preload("User").
		Preload("Tenant").
		First(&userTenant).Error
	if err != nil {
		return nil, err
	}
	return &userTenant, nil
}

// GetAllByUser retrieves all tenants for a user
func (r *userTenantRepository) GetAllByUser(userID uint) ([]models.UserTenant, error) {
	var userTenants []models.UserTenant
	err := r.db.Where("user_id = ?", userID).
		Preload("Tenant").
		Find(&userTenants).Error
	return userTenants, err
}

// GetAllByTenant retrieves all users for a tenant
func (r *userTenantRepository) GetAllByTenant(tenantID uint) ([]models.UserTenant, error) {
	var userTenants []models.UserTenant
	err := r.db.Where("tenant_id = ?", tenantID).
		Preload("User").
		Find(&userTenants).Error
	return userTenants, err
}

// Update updates a user-tenant relationship
func (r *userTenantRepository) Update(userTenant *models.UserTenant) error {
	return r.db.Model(&models.UserTenant{}).
		Where("user_id = ? AND tenant_id = ?", userTenant.UserID, userTenant.TenantID).
		Updates(userTenant).Error
}

// Delete removes a user-tenant relationship
func (r *userTenantRepository) Delete(userID, tenantID uint) error {
	return r.db.Where("user_id = ? AND tenant_id = ?", userID, tenantID).
		Delete(&models.UserTenant{}).Error
}

// UserBelongsToTenant checks if a user belongs to a tenant
func (r *userTenantRepository) UserBelongsToTenant(userID, tenantID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.UserTenant{}).
		Where("user_id = ? AND tenant_id = ? AND is_active = ?", userID, tenantID, true).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
