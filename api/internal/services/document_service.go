package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const maxFileSize = 10 * 1024 * 1024 // 10 MB

// DocumentService defines the interface for document operations
type DocumentService interface {
	Upload(tenantID, userID uint, folderID *uint, file multipart.File, header *multipart.FileHeader) (*models.Document, error)
	GetAll(tenantID uint, folderID *uint) ([]models.Document, error)
	GetByID(tenantID, docID uint) (*models.Document, error)
	GetDownloadURL(tenantID, docID uint) (string, error)
	Delete(tenantID, docID uint) error
	MoveToFolder(tenantID, docID uint, folderID *uint) error
}

// documentService implements DocumentService
type documentService struct {
	docRepo    repositories.DocumentRepository
	folderRepo repositories.FolderRepository
	storageSvc StorageService
}

// NewDocumentService creates a new document service
func NewDocumentService(
	docRepo repositories.DocumentRepository,
	folderRepo repositories.FolderRepository,
	storageSvc StorageService,
) DocumentService {
	return &documentService{
		docRepo:    docRepo,
		folderRepo: folderRepo,
		storageSvc: storageSvc,
	}
}

// Upload uploads a file and creates a document record
func (s *documentService) Upload(tenantID, userID uint, folderID *uint, file multipart.File, header *multipart.FileHeader) (*models.Document, error) {
	// Validate file size
	if header.Size > maxFileSize {
		return nil, errors.New("file size exceeds maximum of 10MB")
	}

	// Validate folder exists if specified
	if folderID != nil {
		_, err := s.folderRepo.GetByID(tenantID, *folderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("folder not found")
			}
			return nil, fmt.Errorf("failed to validate folder: %w", err)
		}
	}

	// Generate S3 key
	fileUUID := uuid.New().String()
	s3Key := fmt.Sprintf("tenants/%d/documents/%s/%s", tenantID, fileUUID, header.Filename)

	// Detect content type
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Upload to S3
	ctx := context.Background()
	if err := s.storageSvc.Upload(ctx, s3Key, file, contentType, header.Size); err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Save document metadata
	doc := &models.Document{
		TenantID:     tenantID,
		FolderID:     folderID,
		Name:         header.Filename,
		OriginalName: header.Filename,
		ContentType:  contentType,
		Size:         header.Size,
		S3Key:        s3Key,
		UploadedByID: userID,
	}

	if err := s.docRepo.Create(doc); err != nil {
		// Try to clean up the uploaded file on DB error
		_ = s.storageSvc.Delete(ctx, s3Key)
		return nil, fmt.Errorf("failed to save document: %w", err)
	}

	return doc, nil
}

// GetAll retrieves all documents, optionally filtered by folder
func (s *documentService) GetAll(tenantID uint, folderID *uint) ([]models.Document, error) {
	docs, err := s.docRepo.GetAll(tenantID, folderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get documents: %w", err)
	}
	return docs, nil
}

// GetByID retrieves a document by ID
func (s *documentService) GetByID(tenantID, docID uint) (*models.Document, error) {
	doc, err := s.docRepo.GetByID(tenantID, docID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("document not found")
		}
		return nil, fmt.Errorf("failed to get document: %w", err)
	}
	return doc, nil
}

// GetDownloadURL generates a presigned URL for downloading a document
func (s *documentService) GetDownloadURL(tenantID, docID uint) (string, error) {
	doc, err := s.docRepo.GetByID(tenantID, docID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("document not found")
		}
		return "", fmt.Errorf("failed to get document: %w", err)
	}

	url, err := s.storageSvc.GetPresignedURL(context.Background(), doc.S3Key, 15*time.Minute)
	if err != nil {
		return "", fmt.Errorf("failed to generate download URL: %w", err)
	}

	return url, nil
}

// Delete removes a document from S3 and the database
func (s *documentService) Delete(tenantID, docID uint) error {
	doc, err := s.docRepo.GetByID(tenantID, docID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("document not found")
		}
		return fmt.Errorf("failed to get document: %w", err)
	}

	// Delete from S3
	if err := s.storageSvc.Delete(context.Background(), doc.S3Key); err != nil {
		return fmt.Errorf("failed to delete file from storage: %w", err)
	}

	// Delete from database
	if err := s.docRepo.Delete(tenantID, docID); err != nil {
		return fmt.Errorf("failed to delete document record: %w", err)
	}

	return nil
}

// MoveToFolder moves a document to a different folder
func (s *documentService) MoveToFolder(tenantID, docID uint, folderID *uint) error {
	doc, err := s.docRepo.GetByID(tenantID, docID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("document not found")
		}
		return fmt.Errorf("failed to get document: %w", err)
	}

	// Validate target folder exists if specified
	if folderID != nil {
		_, err := s.folderRepo.GetByID(tenantID, *folderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("target folder not found")
			}
			return fmt.Errorf("failed to validate folder: %w", err)
		}
	}

	doc.FolderID = folderID
	if err := s.docRepo.Update(doc); err != nil {
		return fmt.Errorf("failed to move document: %w", err)
	}

	return nil
}
