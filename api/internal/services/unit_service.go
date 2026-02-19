package services

import (
	"errors"
	"fmt"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"gorm.io/gorm"
)

// UnitService defines the interface for unit operations
type UnitService interface {
	Create(unit *models.Unit) error
	GetByID(tenantID, unitID uint) (*models.Unit, error)
	GetByNumber(tenantID uint, number string) (*models.Unit, error)
	GetAll(tenantID uint) ([]models.Unit, error)
	GetByBlock(tenantID uint, block string) ([]models.Unit, error)
	Update(unit *models.Unit) error
	Delete(tenantID, unitID uint) error
}

// unitService implements UnitService
type unitService struct {
	unitRepo   repositories.UnitRepository
	tenantRepo repositories.TenantRepository
}

// NewUnitService creates a new unit service
func NewUnitService(
	unitRepo repositories.UnitRepository,
	tenantRepo repositories.TenantRepository,
) UnitService {
	return &unitService{
		unitRepo:   unitRepo,
		tenantRepo: tenantRepo,
	}
}

// Create creates a new unit with validation
func (s *unitService) Create(unit *models.Unit) error {
	// Validate tenant exists and is active
	tenant, err := s.tenantRepo.GetByID(unit.TenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("tenant not found")
		}
		return fmt.Errorf("failed to get tenant: %w", err)
	}

	if !tenant.Active {
		return errors.New("tenant is inactive")
	}

	// Validate required fields
	if unit.Number == "" {
		return errors.New("unit number is required")
	}

	// Check if unit number already exists for this tenant
	existingUnit, err := s.unitRepo.GetByNumber(unit.TenantID, unit.Number)
	if err == nil && existingUnit != nil {
		return errors.New("unit number already registered for this tenant")
	}

	// Set default values
	unit.Active = true
	if unit.Occupied {
		unit.Occupied = true
	}

	// Create unit
	if err := s.unitRepo.Create(unit); err != nil {
		return fmt.Errorf("failed to create unit: %w", err)
	}

	return nil
}

// GetByID retrieves a unit by ID with tenant isolation
func (s *unitService) GetByID(tenantID, unitID uint) (*models.Unit, error) {
	unit, err := s.unitRepo.GetByID(tenantID, unitID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("unit not found")
		}
		return nil, fmt.Errorf("failed to get unit: %w", err)
	}

	return unit, nil
}

// GetByNumber retrieves a unit by number with tenant isolation
func (s *unitService) GetByNumber(tenantID uint, number string) (*models.Unit, error) {
	if number == "" {
		return nil, errors.New("unit number is required")
	}

	unit, err := s.unitRepo.GetByNumber(tenantID, number)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("unit not found")
		}
		return nil, fmt.Errorf("failed to get unit: %w", err)
	}

	return unit, nil
}

// GetAll retrieves all units for a tenant
func (s *unitService) GetAll(tenantID uint) ([]models.Unit, error) {
	units, err := s.unitRepo.GetAll(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get units: %w", err)
	}

	return units, nil
}

// GetByBlock retrieves units by block with tenant isolation
func (s *unitService) GetByBlock(tenantID uint, block string) ([]models.Unit, error) {
	if block == "" {
		return nil, errors.New("block is required")
	}

	units, err := s.unitRepo.GetByBlock(tenantID, block)
	if err != nil {
		return nil, fmt.Errorf("failed to get units: %w", err)
	}

	return units, nil
}

// Update updates a unit
func (s *unitService) Update(unit *models.Unit) error {
	// Validate unit exists
	existing, err := s.unitRepo.GetByID(unit.TenantID, unit.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("unit not found")
		}
		return fmt.Errorf("failed to get unit: %w", err)
	}

	// Validate required fields
	if unit.Number == "" {
		return errors.New("unit number is required")
	}

	// Check if number is being changed and if it's already taken
	if unit.Number != existing.Number {
		existingWithNumber, err := s.unitRepo.GetByNumber(unit.TenantID, unit.Number)
		if err == nil && existingWithNumber != nil && existingWithNumber.ID != unit.ID {
			return errors.New("unit number already registered for this tenant")
		}
	}

	// Update unit
	if err := s.unitRepo.Update(unit); err != nil {
		return fmt.Errorf("failed to update unit: %w", err)
	}

	return nil
}

// Delete soft deletes a unit with tenant isolation
func (s *unitService) Delete(tenantID, unitID uint) error {
	// Validate unit exists
	_, err := s.unitRepo.GetByID(tenantID, unitID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("unit not found")
		}
		return fmt.Errorf("failed to get unit: %w", err)
	}

	// Delete unit
	if err := s.unitRepo.Delete(tenantID, unitID); err != nil {
		return fmt.Errorf("failed to delete unit: %w", err)
	}

	return nil
}
