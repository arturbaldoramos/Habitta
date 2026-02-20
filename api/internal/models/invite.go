package models

import "time"

// InviteStatus represents the status of an invite
type InviteStatus string

const (
	InviteStatusPending   InviteStatus = "pending"
	InviteStatusAccepted  InviteStatus = "accepted"
	InviteStatusExpired   InviteStatus = "expired"
	InviteStatusCancelled InviteStatus = "cancelled"
)

// Invite represents an invitation for a user to join a tenant
type Invite struct {
	BaseModel
	TenantID         uint         `gorm:"not null;index" json:"tenant_id"`
	Email            string       `gorm:"type:varchar(255);not null;index" json:"email"`
	Role             UserRole     `gorm:"type:varchar(50);not null;default:'morador'" json:"role"`
	Token            string       `gorm:"type:varchar(255);not null;uniqueIndex" json:"token"`
	Status           InviteStatus `gorm:"type:varchar(50);not null;default:'pending'" json:"status"`
	InvitedByUserID  uint         `gorm:"not null" json:"invited_by_user_id"`
	AcceptedByUserID *uint        `json:"accepted_by_user_id,omitempty"`
	ExpiresAt        time.Time    `gorm:"not null" json:"expires_at"`
	AcceptedAt       *time.Time   `json:"accepted_at,omitempty"`

	// Relationships
	Tenant     *Tenant `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"tenant,omitempty"`
	InvitedBy  *User   `gorm:"foreignKey:InvitedByUserID;constraint:OnDelete:CASCADE" json:"invited_by,omitempty"`
	AcceptedBy *User   `gorm:"foreignKey:AcceptedByUserID;constraint:OnDelete:SET NULL" json:"accepted_by,omitempty"`
}

// TableName specifies the table name for Invite model
func (Invite) TableName() string {
	return "invites"
}

// IsValid checks if the invite is still valid (pending and not expired)
func (i *Invite) IsValid() bool {
	return i.Status == InviteStatusPending && !time.Now().After(i.ExpiresAt)
}

// IsExpired checks if the invite has expired
func (i *Invite) IsExpired() bool {
	return time.Now().After(i.ExpiresAt)
}
