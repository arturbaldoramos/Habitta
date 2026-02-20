package models

import "time"

// UserTenant represents the many-to-many relationship between users and tenants
// This allows users to belong to multiple condominiums with different roles
type UserTenant struct {
	BaseModel
	UserID   uint      `gorm:"not null;index" json:"user_id"`
	TenantID uint      `gorm:"not null;index" json:"tenant_id"`
	Role     UserRole  `gorm:"type:varchar(50);not null;default:'morador'" json:"role"`
	IsActive bool      `gorm:"default:true" json:"is_active"`
	JoinedAt time.Time `gorm:"not null" json:"joined_at"`

	// Relationships
	User   *User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Tenant *Tenant `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"tenant,omitempty"`
}

// TableName specifies the table name for UserTenant model
func (UserTenant) TableName() string {
	return "user_tenants"
}
