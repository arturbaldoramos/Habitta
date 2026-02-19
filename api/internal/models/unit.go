package models

// Unit represents a unit (apartment/house) in a condominium
type Unit struct {
	BaseModel
	TenantID uint   `gorm:"not null;index" json:"tenant_id"`
	Number   string `gorm:"type:varchar(50);not null;index:idx_tenant_unit,unique" json:"number" binding:"required"`
	Block    string `gorm:"type:varchar(50)" json:"block"`
	Floor    *int   `json:"floor,omitempty"`
	Area     *float64 `gorm:"type:decimal(10,2)" json:"area,omitempty"`

	// Owner information (optional)
	OwnerName  string `gorm:"type:varchar(255)" json:"owner_name"`
	OwnerEmail string `gorm:"type:varchar(255)" json:"owner_email"`
	OwnerPhone string `gorm:"type:varchar(20)" json:"owner_phone"`

	// Status
	Occupied bool `gorm:"default:true" json:"occupied"`
	Active   bool `gorm:"default:true" json:"active"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"tenant,omitempty"`
	Users  []User  `gorm:"foreignKey:UnitID;constraint:OnDelete:SET NULL" json:"users,omitempty"`
}

// TableName specifies the table name for Unit model
func (Unit) TableName() string {
	return "units"
}
