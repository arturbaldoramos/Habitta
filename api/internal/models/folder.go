package models

// Folder represents a document folder in a condominium
type Folder struct {
	BaseModel
	TenantID    uint    `gorm:"not null;index" json:"tenant_id"`
	Name        string  `gorm:"type:varchar(100);not null" json:"name" binding:"required"`
	Description string  `gorm:"type:varchar(500)" json:"description"`
	Tenant      *Tenant `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"tenant,omitempty"`
}

// TableName specifies the table name for Folder model
func (Folder) TableName() string {
	return "folders"
}
