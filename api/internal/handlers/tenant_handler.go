package handlers

import (
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// TenantHandler handles tenant routes
type TenantHandler struct {
	tenantService services.TenantService
}

// NewTenantHandler creates a new tenant handler
func NewTenantHandler(tenantService services.TenantService) *TenantHandler {
	return &TenantHandler{
		tenantService: tenantService,
	}
}

// Create handles tenant creation
// POST /api/tenants
func (h *TenantHandler) Create(c *gin.Context) {
	var tenant models.Tenant
	if err := c.ShouldBindJSON(&tenant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	if err := h.tenantService.Create(&tenant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": tenant,
	})
}

// GetByID handles getting a tenant by ID
// GET /api/tenants/:id
func (h *TenantHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid tenant ID",
		})
		return
	}

	tenant, err := h.tenantService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": tenant,
	})
}

// GetAll handles getting all tenants
// GET /api/tenants
func (h *TenantHandler) GetAll(c *gin.Context) {
	tenants, err := h.tenantService.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": tenants,
	})
}

// Update handles tenant update
// PUT /api/tenants/:id
func (h *TenantHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid tenant ID",
		})
		return
	}

	var tenant models.Tenant
	if err := c.ShouldBindJSON(&tenant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	tenant.ID = uint(id)

	if err := h.tenantService.Update(&tenant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": tenant,
	})
}

// Delete handles tenant deletion
// DELETE /api/tenants/:id
func (h *TenantHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid tenant ID",
		})
		return
	}

	if err := h.tenantService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "tenant deleted successfully",
	})
}

// RegisterRoutes registers tenant routes
func (h *TenantHandler) RegisterRoutes(router *gin.RouterGroup) {
	tenants := router.Group("/tenants")
	{
		tenants.POST("", h.Create)
		tenants.GET("", h.GetAll)
		tenants.GET("/:id", h.GetByID)
		tenants.PUT("/:id", h.Update)
		tenants.DELETE("/:id", h.Delete)
	}
}
