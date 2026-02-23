package models

// Document represents a file uploaded to a condominium
type Document struct {
	BaseModel
	TenantID     uint    `gorm:"not null;index" json:"tenant_id"`
	FolderID     *uint   `gorm:"index" json:"folder_id"`
	Name         string  `gorm:"type:varchar(255);not null" json:"name"`
	OriginalName string  `gorm:"type:varchar(255);not null" json:"original_name"`
	ContentType  string  `gorm:"type:varchar(100)" json:"content_type"`
	Size         int64   `json:"size"`
	S3Key        string  `gorm:"type:varchar(500);not null" json:"s3_key"`
	UploadedByID uint    `gorm:"not null" json:"uploaded_by_id"`
	Tenant       *Tenant `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"tenant,omitempty"`
	Folder       *Folder `gorm:"foreignKey:FolderID;constraint:OnDelete:SET NULL" json:"folder,omitempty"`
	UploadedBy   *User   `gorm:"foreignKey:UploadedByID" json:"uploaded_by,omitempty"`
}

// TableName specifies the table name for Document model
func (Document) TableName() string {
	return "documents"
}
