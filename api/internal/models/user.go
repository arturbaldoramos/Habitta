package models

// UserRole represents the role of a user in the system
type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleSindico UserRole = "sindico"
	RoleMorador UserRole = "morador"
)

// User represents a user in the system (admin, síndico, or morador)
type User struct {
	BaseModel
	TenantID uint     `gorm:"not null;index" json:"tenant_id"`
	Email    string   `gorm:"type:varchar(255);not null;index:idx_tenant_email,unique" json:"email" binding:"required,email"`
	Password string   `gorm:"type:varchar(255);not null" json:"-"`
	Name     string   `gorm:"type:varchar(255);not null" json:"name" binding:"required"`
	Role     UserRole `gorm:"type:varchar(50);not null;default:'morador'" json:"role" binding:"required,oneof=admin sindico morador"`
	Active   bool     `gorm:"default:true" json:"active"`

	// Optional fields
	Phone  string `gorm:"type:varchar(20)" json:"phone"`
	CPF    string `gorm:"type:varchar(14);index:idx_tenant_cpf,unique" json:"cpf"`
	UnitID *uint  `gorm:"index" json:"unit_id,omitempty"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"tenant,omitempty"`
	Unit   *Unit   `gorm:"foreignKey:UnitID;constraint:OnDelete:SET NULL" json:"unit,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// IsAdmin checks if user has admin role
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

// IsSindico checks if user has síndico role
func (u *User) IsSindico() bool {
	return u.Role == RoleSindico
}

// IsMorador checks if user has morador role
func (u *User) IsMorador() bool {
	return u.Role == RoleMorador
}
