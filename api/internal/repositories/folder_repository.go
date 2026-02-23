package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// FolderRepository defines the interface for folder operations
type FolderRepository interface {
	Create(folder *models.Folder) error
	GetByID(tenantID, folderID uint) (*models.Folder, error)
	GetAll(tenantID uint) ([]models.Folder, error)
	GetByName(tenantID uint, name string) (*models.Folder, error)
	Update(folder *models.Folder) error
	Delete(tenantID, folderID uint) error
}

// folderRepository implements FolderRepository
type folderRepository struct {
	db *gorm.DB
}

// NewFolderRepository creates a new folder repository
func NewFolderRepository(db *gorm.DB) FolderRepository {
	return &folderRepository{db: db}
}

// Create creates a new folder
func (r *folderRepository) Create(folder *models.Folder) error {
	return r.db.Create(folder).Error
}

// GetByID retrieves a folder by ID with tenant isolation
func (r *folderRepository) GetByID(tenantID, folderID uint) (*models.Folder, error) {
	var folder models.Folder
	err := r.db.Where("tenant_id = ? AND id = ?", tenantID, folderID).
		First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

// GetAll retrieves all folders for a tenant
func (r *folderRepository) GetAll(tenantID uint) ([]models.Folder, error) {
	var folders []models.Folder
	err := r.db.Where("tenant_id = ?", tenantID).
		Order("name ASC").
		Find(&folders).Error
	return folders, err
}

// GetByName retrieves a folder by name with tenant isolation
func (r *folderRepository) GetByName(tenantID uint, name string) (*models.Folder, error) {
	var folder models.Folder
	err := r.db.Where("tenant_id = ? AND name = ?", tenantID, name).
		First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

// Update updates a folder
func (r *folderRepository) Update(folder *models.Folder) error {
	return r.db.Model(&models.Folder{}).
		Where("tenant_id = ? AND id = ?", folder.TenantID, folder.ID).
		Select("*").
		Omit("created_at", "Tenant").
		Updates(folder).Error
}

// Delete soft deletes a folder with tenant isolation
func (r *folderRepository) Delete(tenantID, folderID uint) error {
	return r.db.Where("tenant_id = ? AND id = ?", tenantID, folderID).
		Delete(&models.Folder{}).Error
}
