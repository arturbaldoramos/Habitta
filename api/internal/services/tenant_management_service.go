package services

import (
	"fmt"
	"time"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"gorm.io/gorm"
)

// CreateTenantRequest represents the request to create a new tenant
type CreateTenantRequest struct {
	Name  string `json:"name" binding:"required"`
	CNPJ  string `json:"cnpj" binding:"required"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}

// TenantManagementService defines the interface for tenant management operations
type TenantManagementService interface {
	CreateTenantByUser(userID uint, req CreateTenantRequest) (*models.Tenant, error)
}

// tenantManagementService implements TenantManagementService
type tenantManagementService struct {
	tenantRepo     repositories.TenantRepository
	userTenantRepo repositories.UserTenantRepository
	db             *gorm.DB
}

// NewTenantManagementService creates a new tenant management service
func NewTenantManagementService(
	tenantRepo repositories.TenantRepository,
	userTenantRepo repositories.UserTenantRepository,
	db *gorm.DB,
) TenantManagementService {
	return &tenantManagementService{
		tenantRepo:     tenantRepo,
		userTenantRepo: userTenantRepo,
		db:             db,
	}
}

// CreateTenantByUser creates a new tenant and makes the user a síndico automatically
func (s *tenantManagementService) CreateTenantByUser(userID uint, req CreateTenantRequest) (*models.Tenant, error) {
	// Use transaction to ensure both tenant and user_tenant are created together
	var tenant *models.Tenant
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Create tenant
		tenant = &models.Tenant{
			Name:   req.Name,
			CNPJ:   req.CNPJ,
			Email:  req.Email,
			Phone:  req.Phone,
			Active: true,
		}

		if err := tx.Create(tenant).Error; err != nil {
			return fmt.Errorf("failed to create tenant: %w", err)
		}

		// Create user-tenant relationship with síndico role
		userTenant := &models.UserTenant{
			UserID:   userID,
			TenantID: tenant.ID,
			Role:     models.RoleSindico,
			IsActive: true,
			JoinedAt: time.Now(),
		}

		if err := tx.Create(userTenant).Error; err != nil {
			return fmt.Errorf("failed to create user-tenant relationship: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return tenant, nil
}
