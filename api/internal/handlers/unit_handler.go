package handlers

import (
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// UnitHandler handles unit routes
type UnitHandler struct {
	unitService services.UnitService
}

// NewUnitHandler creates a new unit handler
func NewUnitHandler(unitService services.UnitService) *UnitHandler {
	return &UnitHandler{
		unitService: unitService,
	}
}

// Create handles unit creation
// POST /api/units
func (h *UnitHandler) Create(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	var unit models.Unit
	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Override tenant_id from context for security
	unit.TenantID = tenantID

	if err := h.unitService.Create(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": unit,
	})
}

// GetByID handles getting a unit by ID
// GET /api/units/:id
func (h *UnitHandler) GetByID(c *gin.Context) {
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
			"message": "invalid unit ID",
		})
		return
	}

	unit, err := h.unitService.GetByID(tenantID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": unit,
	})
}

// GetAll handles getting all units for a tenant
// GET /api/units
func (h *UnitHandler) GetAll(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	// Optional: filter by block
	blockParam := c.Query("block")
	if blockParam != "" {
		units, err := h.unitService.GetByBlock(tenantID, blockParam)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Internal Server Error",
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": units,
		})
		return
	}

	units, err := h.unitService.GetAll(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": units,
	})
}

// Update handles unit update
// PUT /api/units/:id
func (h *UnitHandler) Update(c *gin.Context) {
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
			"message": "invalid unit ID",
		})
		return
	}

	var unit models.Unit
	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Override tenant_id and unit_id from context/params for security
	unit.ID = uint(id)
	unit.TenantID = tenantID

	if err := h.unitService.Update(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": unit,
	})
}

// Delete handles unit deletion
// DELETE /api/units/:id
func (h *UnitHandler) Delete(c *gin.Context) {
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
			"message": "invalid unit ID",
		})
		return
	}

	if err := h.unitService.Delete(tenantID, uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "unit deleted successfully",
	})
}

// RegisterRoutes registers unit routes
func (h *UnitHandler) RegisterRoutes(router *gin.RouterGroup) {
	units := router.Group("/units")
	{
		units.POST("", h.Create)
		units.GET("", h.GetAll)
		units.GET("/:id", h.GetByID)
		units.PUT("/:id", h.Update)
		units.DELETE("/:id", h.Delete)
	}
}
