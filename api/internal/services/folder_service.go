package services

import (
	"errors"
	"fmt"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"gorm.io/gorm"
)

// FolderService defines the interface for folder operations
type FolderService interface {
	Create(folder *models.Folder) error
	GetByID(tenantID, folderID uint) (*models.Folder, error)
	GetAll(tenantID uint) ([]models.Folder, error)
	Update(folder *models.Folder) error
	Delete(tenantID, folderID uint) error
}

// folderService implements FolderService
type folderService struct {
	folderRepo repositories.FolderRepository
}

// NewFolderService creates a new folder service
func NewFolderService(folderRepo repositories.FolderRepository) FolderService {
	return &folderService{
		folderRepo: folderRepo,
	}
}

// Create creates a new folder with validation
func (s *folderService) Create(folder *models.Folder) error {
	if folder.Name == "" {
		return errors.New("folder name is required")
	}

	// Check if folder name already exists for this tenant
	existing, err := s.folderRepo.GetByName(folder.TenantID, folder.Name)
	if err == nil && existing != nil {
		return errors.New("folder name already exists for this tenant")
	}

	if err := s.folderRepo.Create(folder); err != nil {
		return fmt.Errorf("failed to create folder: %w", err)
	}

	return nil
}

// GetByID retrieves a folder by ID
func (s *folderService) GetByID(tenantID, folderID uint) (*models.Folder, error) {
	folder, err := s.folderRepo.GetByID(tenantID, folderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("folder not found")
		}
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}
	return folder, nil
}

// GetAll retrieves all folders for a tenant
func (s *folderService) GetAll(tenantID uint) ([]models.Folder, error) {
	folders, err := s.folderRepo.GetAll(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get folders: %w", err)
	}
	return folders, nil
}

// Update updates a folder
func (s *folderService) Update(folder *models.Folder) error {
	existing, err := s.folderRepo.GetByID(folder.TenantID, folder.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("folder not found")
		}
		return fmt.Errorf("failed to get folder: %w", err)
	}

	if folder.Name == "" {
		return errors.New("folder name is required")
	}

	// Check if name is being changed and if it's already taken
	if folder.Name != existing.Name {
		existingWithName, err := s.folderRepo.GetByName(folder.TenantID, folder.Name)
		if err == nil && existingWithName != nil && existingWithName.ID != folder.ID {
			return errors.New("folder name already exists for this tenant")
		}
	}

	if err := s.folderRepo.Update(folder); err != nil {
		return fmt.Errorf("failed to update folder: %w", err)
	}

	return nil
}

// Delete deletes a folder
func (s *folderService) Delete(tenantID, folderID uint) error {
	_, err := s.folderRepo.GetByID(tenantID, folderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("folder not found")
		}
		return fmt.Errorf("failed to get folder: %w", err)
	}

	if err := s.folderRepo.Delete(tenantID, folderID); err != nil {
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	return nil
}
