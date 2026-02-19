package services

import (
	"errors"
	"fmt"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"gorm.io/gorm"
)

// TenantService defines the interface for tenant operations
type TenantService interface {
	Create(tenant *models.Tenant) error
	GetByID(id uint) (*models.Tenant, error)
	GetByCNPJ(cnpj string) (*models.Tenant, error)
	GetAll() ([]models.Tenant, error)
	Update(tenant *models.Tenant) error
	Delete(id uint) error
}

// tenantService implements TenantService
type tenantService struct {
	tenantRepo repositories.TenantRepository
}

// NewTenantService creates a new tenant service
func NewTenantService(tenantRepo repositories.TenantRepository) TenantService {
	return &tenantService{
		tenantRepo: tenantRepo,
	}
}

// Create creates a new tenant with validation
func (s *tenantService) Create(tenant *models.Tenant) error {
	// Validate required fields
	if tenant.Name == "" {
		return errors.New("tenant name is required")
	}

	if tenant.CNPJ == "" {
		return errors.New("CNPJ is required")
	}

	// Check if CNPJ already exists
	existingTenant, err := s.tenantRepo.GetByCNPJ(tenant.CNPJ)
	if err == nil && existingTenant != nil {
		return errors.New("CNPJ already registered")
	}

	// Set default values
	tenant.Active = true

	// Create tenant
	if err := s.tenantRepo.Create(tenant); err != nil {
		return fmt.Errorf("failed to create tenant: %w", err)
	}

	return nil
}

// GetByID retrieves a tenant by ID
func (s *tenantService) GetByID(id uint) (*models.Tenant, error) {
	tenant, err := s.tenantRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("tenant not found")
		}
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	return tenant, nil
}

// GetByCNPJ retrieves a tenant by CNPJ
func (s *tenantService) GetByCNPJ(cnpj string) (*models.Tenant, error) {
	if cnpj == "" {
		return nil, errors.New("CNPJ is required")
	}

	tenant, err := s.tenantRepo.GetByCNPJ(cnpj)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("tenant not found")
		}
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	return tenant, nil
}

// GetAll retrieves all tenants
func (s *tenantService) GetAll() ([]models.Tenant, error) {
	tenants, err := s.tenantRepo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("failed to get tenants: %w", err)
	}

	return tenants, nil
}

// Update updates a tenant
func (s *tenantService) Update(tenant *models.Tenant) error {
	// Validate tenant exists
	existing, err := s.tenantRepo.GetByID(tenant.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("tenant not found")
		}
		return fmt.Errorf("failed to get tenant: %w", err)
	}

	// Validate required fields
	if tenant.Name == "" {
		return errors.New("tenant name is required")
	}

	if tenant.CNPJ == "" {
		return errors.New("CNPJ is required")
	}

	// Check if CNPJ is being changed and if it's already taken
	if tenant.CNPJ != existing.CNPJ {
		existingWithCNPJ, err := s.tenantRepo.GetByCNPJ(tenant.CNPJ)
		if err == nil && existingWithCNPJ != nil && existingWithCNPJ.ID != tenant.ID {
			return errors.New("CNPJ already registered")
		}
	}

	// Update tenant
	if err := s.tenantRepo.Update(tenant); err != nil {
		return fmt.Errorf("failed to update tenant: %w", err)
	}

	return nil
}

// Delete soft deletes a tenant
func (s *tenantService) Delete(id uint) error {
	// Validate tenant exists
	_, err := s.tenantRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("tenant not found")
		}
		return fmt.Errorf("failed to get tenant: %w", err)
	}

	// Delete tenant (cascade will handle users and units)
	if err := s.tenantRepo.Delete(id); err != nil {
		return fmt.Errorf("failed to delete tenant: %w", err)
	}

	return nil
}
