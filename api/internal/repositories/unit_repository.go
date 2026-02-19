package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// UnitRepository defines the interface for unit operations
type UnitRepository interface {
	Create(unit *models.Unit) error
	GetByID(tenantID, unitID uint) (*models.Unit, error)
	GetByNumber(tenantID uint, number string) (*models.Unit, error)
	GetAll(tenantID uint) ([]models.Unit, error)
	GetByBlock(tenantID uint, block string) ([]models.Unit, error)
	Update(unit *models.Unit) error
	Delete(tenantID, unitID uint) error
}

// unitRepository implements UnitRepository
type unitRepository struct {
	db *gorm.DB
}

// NewUnitRepository creates a new unit repository
func NewUnitRepository(db *gorm.DB) UnitRepository {
	return &unitRepository{db: db}
}

// Create creates a new unit
func (r *unitRepository) Create(unit *models.Unit) error {
	return r.db.Create(unit).Error
}

// GetByID retrieves a unit by ID with tenant isolation
func (r *unitRepository) GetByID(tenantID, unitID uint) (*models.Unit, error) {
	var unit models.Unit
	err := r.db.Where("tenant_id = ? AND id = ?", tenantID, unitID).
		Preload("Tenant").
		Preload("Users").
		First(&unit).Error
	if err != nil {
		return nil, err
	}
	return &unit, nil
}

// GetByNumber retrieves a unit by number with tenant isolation
func (r *unitRepository) GetByNumber(tenantID uint, number string) (*models.Unit, error) {
	var unit models.Unit
	err := r.db.Where("tenant_id = ? AND number = ?", tenantID, number).
		Preload("Tenant").
		Preload("Users").
		First(&unit).Error
	if err != nil {
		return nil, err
	}
	return &unit, nil
}

// GetAll retrieves all units for a tenant
func (r *unitRepository) GetAll(tenantID uint) ([]models.Unit, error) {
	var units []models.Unit
	err := r.db.Where("tenant_id = ?", tenantID).
		Preload("Users").
		Find(&units).Error
	return units, err
}

// GetByBlock retrieves units by block with tenant isolation
func (r *unitRepository) GetByBlock(tenantID uint, block string) ([]models.Unit, error) {
	var units []models.Unit
	err := r.db.Where("tenant_id = ? AND block = ?", tenantID, block).
		Preload("Users").
		Find(&units).Error
	return units, err
}

// Update updates a unit (validates tenant_id to prevent cross-tenant updates)
func (r *unitRepository) Update(unit *models.Unit) error {
	// Ensure we only update the unit belonging to the correct tenant
	return r.db.Model(&models.Unit{}).
		Where("tenant_id = ? AND id = ?", unit.TenantID, unit.ID).
		Updates(unit).Error
}

// Delete soft deletes a unit with tenant isolation
func (r *unitRepository) Delete(tenantID, unitID uint) error {
	return r.db.Where("tenant_id = ? AND id = ?", tenantID, unitID).
		Delete(&models.Unit{}).Error
}
