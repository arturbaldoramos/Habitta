package models

import "errors"

// ErrUserNotInTenant is returned when a user doesn't belong to a tenant
var ErrUserNotInTenant = errors.New("user does not belong to this tenant")

// UserRole represents the role of a user in the system
type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleSindico UserRole = "sindico"
	RoleMorador UserRole = "morador"
)

// User represents a user in the system (admin, síndico, or morador)
// Users can belong to multiple tenants with different roles
type User struct {
	BaseModel
	Email    string `gorm:"type:varchar(255);not null;uniqueIndex" json:"email" binding:"required,email"`
	Password string `gorm:"type:varchar(255);not null" json:"-"`
	Name     string `gorm:"type:varchar(255);not null" json:"name" binding:"required"`
	Active   bool   `gorm:"default:true" json:"active"`

	// Optional fields
	Phone  string `gorm:"type:varchar(20)" json:"phone"`
	CPF    string `gorm:"type:varchar(14);uniqueIndex" json:"cpf"`
	UnitID *uint  `gorm:"index" json:"unit_id,omitempty"`

	// Relationships - Many-to-Many with Tenant
	UserTenants []UserTenant `gorm:"foreignKey:UserID" json:"user_tenants,omitempty"`
	Tenants     []Tenant     `gorm:"many2many:user_tenants" json:"tenants,omitempty"`
	Unit        *Unit        `gorm:"foreignKey:UnitID;constraint:OnDelete:SET NULL" json:"unit,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// BelongsToTenant checks if user belongs to a specific tenant
func (u *User) BelongsToTenant(tenantID uint) bool {
	for _, ut := range u.UserTenants {
		if ut.TenantID == tenantID && ut.IsActive {
			return true
		}
	}
	return false
}

// GetRoleInTenant returns the user's role in a specific tenant
func (u *User) GetRoleInTenant(tenantID uint) (UserRole, error) {
	for _, ut := range u.UserTenants {
		if ut.TenantID == tenantID && ut.IsActive {
			return ut.Role, nil
		}
	}
	return "", ErrUserNotInTenant
}

// HasTenants checks if user belongs to any tenant
func (u *User) HasTenants() bool {
	for _, ut := range u.UserTenants {
		if ut.IsActive {
			return true
		}
	}
	return false
}

// IsAdminInTenant checks if user has admin role in a specific tenant
func (u *User) IsAdminInTenant(tenantID uint) bool {
	role, err := u.GetRoleInTenant(tenantID)
	if err != nil {
		return false
	}
	return role == RoleAdmin
}

// IsSindicoInTenant checks if user has síndico role in a specific tenant
func (u *User) IsSindicoInTenant(tenantID uint) bool {
	role, err := u.GetRoleInTenant(tenantID)
	if err != nil {
		return false
	}
	return role == RoleSindico
}

// IsMoradorInTenant checks if user has morador role in a specific tenant
func (u *User) IsMoradorInTenant(tenantID uint) bool {
	role, err := u.GetRoleInTenant(tenantID)
	if err != nil {
		return false
	}
	return role == RoleMorador
}
