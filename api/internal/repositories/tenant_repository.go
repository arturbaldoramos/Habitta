package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// TenantRepository defines the interface for tenant operations
type TenantRepository interface {
	Create(tenant *models.Tenant) error
	GetByID(id uint) (*models.Tenant, error)
	GetByCNPJ(cnpj string) (*models.Tenant, error)
	GetAll() ([]models.Tenant, error)
	Update(tenant *models.Tenant) error
	Delete(id uint) error
}

// tenantRepository implements TenantRepository
type tenantRepository struct {
	db *gorm.DB
}

// NewTenantRepository creates a new tenant repository
func NewTenantRepository(db *gorm.DB) TenantRepository {
	return &tenantRepository{db: db}
}

// Create creates a new tenant
func (r *tenantRepository) Create(tenant *models.Tenant) error {
	return r.db.Create(tenant).Error
}

// GetByID retrieves a tenant by ID
func (r *tenantRepository) GetByID(id uint) (*models.Tenant, error) {
	var tenant models.Tenant
	err := r.db.First(&tenant, id).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

// GetByCNPJ retrieves a tenant by CNPJ
func (r *tenantRepository) GetByCNPJ(cnpj string) (*models.Tenant, error) {
	var tenant models.Tenant
	err := r.db.Where("cnpj = ?", cnpj).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

// GetAll retrieves all tenants
func (r *tenantRepository) GetAll() ([]models.Tenant, error) {
	var tenants []models.Tenant
	err := r.db.Find(&tenants).Error
	return tenants, err
}

// Update updates a tenant
func (r *tenantRepository) Update(tenant *models.Tenant) error {
	return r.db.Save(tenant).Error
}

// Delete soft deletes a tenant
func (r *tenantRepository) Delete(id uint) error {
	return r.db.Delete(&models.Tenant{}, id).Error
}
