package handlers

import (
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// UnitResident represents a resident in the unit detail response
type UnitResident struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

// UnitDetail represents the detailed response for a single unit
type UnitDetail struct {
	ID         uint           `json:"id"`
	Number     string         `json:"number"`
	Block      string         `json:"block"`
	Floor      *int           `json:"floor"`
	Area       *float64       `json:"area"`
	OwnerName  string         `json:"owner_name"`
	OwnerEmail string         `json:"owner_email"`
	OwnerPhone string         `json:"owner_phone"`
	Occupied   bool           `json:"occupied"`
	Active     bool           `json:"active"`
	Residents  []UnitResident `json:"residents"`
}

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

	residents := make([]UnitResident, 0, len(unit.Users))
	for _, u := range unit.Users {
		residents = append(residents, UnitResident{
			ID:    u.ID,
			Name:  u.Name,
			Phone: u.Phone,
		})
	}

	detail := UnitDetail{
		ID:         unit.ID,
		Number:     unit.Number,
		Block:      unit.Block,
		Floor:      unit.Floor,
		Area:       unit.Area,
		OwnerName:  unit.OwnerName,
		OwnerEmail: unit.OwnerEmail,
		OwnerPhone: unit.OwnerPhone,
		Occupied:   unit.Occupied,
		Active:     unit.Active,
		Residents:  residents,
	}

	c.JSON(http.StatusOK, gin.H{
		"data": detail,
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
