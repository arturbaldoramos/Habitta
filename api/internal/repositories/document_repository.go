package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// DocumentRepository defines the interface for document operations
type DocumentRepository interface {
	Create(doc *models.Document) error
	GetByID(tenantID, docID uint) (*models.Document, error)
	GetAll(tenantID uint, folderID *uint) ([]models.Document, error)
	GetByFolder(tenantID, folderID uint) ([]models.Document, error)
	Update(doc *models.Document) error
	Delete(tenantID, docID uint) error
}

// documentRepository implements DocumentRepository
type documentRepository struct {
	db *gorm.DB
}

// NewDocumentRepository creates a new document repository
func NewDocumentRepository(db *gorm.DB) DocumentRepository {
	return &documentRepository{db: db}
}

// Create creates a new document
func (r *documentRepository) Create(doc *models.Document) error {
	return r.db.Create(doc).Error
}

// GetByID retrieves a document by ID with tenant isolation
func (r *documentRepository) GetByID(tenantID, docID uint) (*models.Document, error) {
	var doc models.Document
	err := r.db.Where("tenant_id = ? AND id = ?", tenantID, docID).
		Preload("Folder").
		Preload("UploadedBy").
		First(&doc).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// GetAll retrieves all documents for a tenant, optionally filtered by folder
func (r *documentRepository) GetAll(tenantID uint, folderID *uint) ([]models.Document, error) {
	var docs []models.Document
	query := r.db.Where("tenant_id = ?", tenantID)
	if folderID != nil {
		query = query.Where("folder_id = ?", *folderID)
	}
	err := query.
		Preload("Folder").
		Preload("UploadedBy").
		Order("created_at DESC").
		Find(&docs).Error
	return docs, err
}

// GetByFolder retrieves all documents in a folder
func (r *documentRepository) GetByFolder(tenantID, folderID uint) ([]models.Document, error) {
	var docs []models.Document
	err := r.db.Where("tenant_id = ? AND folder_id = ?", tenantID, folderID).
		Preload("Folder").
		Preload("UploadedBy").
		Order("created_at DESC").
		Find(&docs).Error
	return docs, err
}

// Update updates a document
func (r *documentRepository) Update(doc *models.Document) error {
	return r.db.Model(&models.Document{}).
		Where("tenant_id = ? AND id = ?", doc.TenantID, doc.ID).
		Select("*").
		Omit("created_at", "Tenant", "Folder", "UploadedBy").
		Updates(doc).Error
}

// Delete soft deletes a document with tenant isolation
func (r *documentRepository) Delete(tenantID, docID uint) error {
	return r.db.Where("tenant_id = ? AND id = ?", tenantID, docID).
		Delete(&models.Document{}).Error
}
