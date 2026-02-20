package models

// Tenant represents a condominium (customer/tenant in the SaaS platform)
type Tenant struct {
	BaseModel
	Name   string `gorm:"type:varchar(255);not null" json:"name" binding:"required"`
	CNPJ   string `gorm:"type:varchar(18);uniqueIndex;not null" json:"cnpj" binding:"required"`
	Email  string `gorm:"type:varchar(255)" json:"email"`
	Phone  string `gorm:"type:varchar(20)" json:"phone"`
	Active bool   `gorm:"default:true" json:"active"`

	// Relationships - Many-to-Many with User
	UserTenants []UserTenant `gorm:"foreignKey:TenantID" json:"user_tenants,omitempty"`
	Users       []User       `gorm:"many2many:user_tenants" json:"users,omitempty"`
	Units       []Unit       `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"units,omitempty"`
}

// TableName specifies the table name for Tenant model
func (Tenant) TableName() string {
	return "tenants"
}
