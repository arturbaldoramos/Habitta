package handlers

import (
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// DocumentHandler handles document and folder routes
type DocumentHandler struct {
	folderService   services.FolderService
	documentService services.DocumentService
}

// NewDocumentHandler creates a new document handler
func NewDocumentHandler(
	folderService services.FolderService,
	documentService services.DocumentService,
) *DocumentHandler {
	return &DocumentHandler{
		folderService:   folderService,
		documentService: documentService,
	}
}

// RegisterRoutes registers document and folder routes
func (h *DocumentHandler) RegisterRoutes(router *gin.RouterGroup) {
	folders := router.Group("/folders")
	{
		folders.POST("", h.CreateFolder)
		folders.GET("", h.GetFolders)
		folders.PUT("/:id", h.UpdateFolder)
		folders.DELETE("/:id", h.DeleteFolder)
	}

	documents := router.Group("/documents")
	{
		documents.POST("/upload", h.UploadDocument)
		documents.GET("", h.GetDocuments)
		documents.GET("/:id", h.GetDocument)
		documents.GET("/:id/download", h.GetDownloadURL)
		documents.DELETE("/:id", h.DeleteDocument)
		documents.PATCH("/:id/move", h.MoveDocument)
	}
}

// CreateFolder handles folder creation
// POST /api/folders
func (h *DocumentHandler) CreateFolder(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	var folder models.Folder
	if err := c.ShouldBindJSON(&folder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	folder.TenantID = tenantID

	if err := h.folderService.Create(&folder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": folder,
	})
}

// GetFolders handles listing all folders
// GET /api/folders
func (h *DocumentHandler) GetFolders(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	folders, err := h.folderService.GetAll(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": folders,
	})
}

// UpdateFolder handles folder update
// PUT /api/folders/:id
func (h *DocumentHandler) UpdateFolder(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid folder ID",
		})
		return
	}

	var folder models.Folder
	if err := c.ShouldBindJSON(&folder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	folder.ID = uint(id)
	folder.TenantID = tenantID

	if err := h.folderService.Update(&folder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": folder,
	})
}

// DeleteFolder handles folder deletion
// DELETE /api/folders/:id
func (h *DocumentHandler) DeleteFolder(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid folder ID",
		})
		return
	}

	if err := h.folderService.Delete(tenantID, uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "folder deleted successfully",
	})
}

// UploadDocument handles file upload
// POST /api/documents/upload
func (h *DocumentHandler) UploadDocument(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "user_id not found in context",
		})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "file is required",
		})
		return
	}
	defer file.Close()

	// Parse optional folder_id
	var folderID *uint
	if folderIDStr := c.PostForm("folder_id"); folderIDStr != "" {
		id, err := strconv.ParseUint(folderIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": "invalid folder_id",
			})
			return
		}
		fid := uint(id)
		folderID = &fid
	}

	doc, err := h.documentService.Upload(tenantID, userID, folderID, file, header)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": doc,
	})
}

// GetDocuments handles listing documents
// GET /api/documents?folder_id=1
func (h *DocumentHandler) GetDocuments(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	var folderID *uint
	if folderIDStr := c.Query("folder_id"); folderIDStr != "" {
		id, err := strconv.ParseUint(folderIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": "invalid folder_id",
			})
			return
		}
		fid := uint(id)
		folderID = &fid
	}

	docs, err := h.documentService.GetAll(tenantID, folderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": docs,
	})
}

// GetDocument handles getting a single document
// GET /api/documents/:id
func (h *DocumentHandler) GetDocument(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid document ID",
		})
		return
	}

	doc, err := h.documentService.GetByID(tenantID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": doc,
	})
}

// GetDownloadURL handles generating a presigned download URL
// GET /api/documents/:id/download
func (h *DocumentHandler) GetDownloadURL(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid document ID",
		})
		return
	}

	url, err := h.documentService.GetDownloadURL(tenantID, uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"url": url,
		},
	})
}

// DeleteDocument handles document deletion
// DELETE /api/documents/:id
func (h *DocumentHandler) DeleteDocument(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid document ID",
		})
		return
	}

	if err := h.documentService.Delete(tenantID, uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "document deleted successfully",
	})
}

// MoveDocument handles moving a document to a different folder
// PATCH /api/documents/:id/move
func (h *DocumentHandler) MoveDocument(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid document ID",
		})
		return
	}

	var body struct {
		FolderID *uint `json:"folder_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	if err := h.documentService.MoveToFolder(tenantID, uint(id), body.FolderID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "document moved successfully",
	})
}
