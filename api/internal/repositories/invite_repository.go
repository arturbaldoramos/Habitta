package repositories

import (
	"github.com/arturbaldoramos/Habitta/internal/models"
	"gorm.io/gorm"
)

// InviteRepository defines the interface for invite operations
type InviteRepository interface {
	Create(invite *models.Invite) error
	GetByToken(token string) (*models.Invite, error)
	GetByID(id uint) (*models.Invite, error)
	GetPendingByEmail(email string) ([]models.Invite, error)
	GetByTenant(tenantID uint) ([]models.Invite, error)
	Update(invite *models.Invite) error
	Delete(id uint) error
}

// inviteRepository implements InviteRepository
type inviteRepository struct {
	db *gorm.DB
}

// NewInviteRepository creates a new invite repository
func NewInviteRepository(db *gorm.DB) InviteRepository {
	return &inviteRepository{db: db}
}

// Create creates a new invite
func (r *inviteRepository) Create(invite *models.Invite) error {
	return r.db.Create(invite).Error
}

// GetByToken retrieves an invite by token
func (r *inviteRepository) GetByToken(token string) (*models.Invite, error) {
	var invite models.Invite
	err := r.db.Where("token = ?", token).
		Preload("Tenant").
		Preload("InvitedBy").
		Preload("AcceptedBy").
		First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}

// GetByID retrieves an invite by ID
func (r *inviteRepository) GetByID(id uint) (*models.Invite, error) {
	var invite models.Invite
	err := r.db.Where("id = ?", id).
		Preload("Tenant").
		Preload("InvitedBy").
		Preload("AcceptedBy").
		First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}

// GetPendingByEmail retrieves pending invites for an email
func (r *inviteRepository) GetPendingByEmail(email string) ([]models.Invite, error) {
	var invites []models.Invite
	err := r.db.Where("email = ? AND status = ?", email, models.InviteStatusPending).
		Preload("Tenant").
		Preload("InvitedBy").
		Find(&invites).Error
	return invites, err
}

// GetByTenant retrieves all invites for a tenant
func (r *inviteRepository) GetByTenant(tenantID uint) ([]models.Invite, error) {
	var invites []models.Invite
	err := r.db.Where("tenant_id = ?", tenantID).
		Preload("InvitedBy").
		Preload("AcceptedBy").
		Find(&invites).Error
	return invites, err
}

// Update updates an invite
func (r *inviteRepository) Update(invite *models.Invite) error {
	return r.db.Save(invite).Error
}

// Delete soft deletes an invite
func (r *inviteRepository) Delete(id uint) error {
	return r.db.Delete(&models.Invite{}, id).Error
}
