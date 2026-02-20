package handlers

import (
	"net/http"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// TenantManagementHandler handles tenant management routes
type TenantManagementHandler struct {
	tenantMgmtService services.TenantManagementService
}

// NewTenantManagementHandler creates a new tenant management handler
func NewTenantManagementHandler(tenantMgmtService services.TenantManagementService) *TenantManagementHandler {
	return &TenantManagementHandler{
		tenantMgmtService: tenantMgmtService,
	}
}

// CreateTenant handles creating a new tenant (user becomes síndico)
// POST /api/tenants/create
func (h *TenantManagementHandler) CreateTenant(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "user not found in context",
		})
		return
	}

	var req services.CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	tenant, err := h.tenantMgmtService.CreateTenantByUser(userID, req)
	if err != nil {
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
