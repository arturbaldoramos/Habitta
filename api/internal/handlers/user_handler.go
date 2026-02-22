package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// UserListItem is the flat response struct for user listing
type UserListItem struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
	IsActive bool   `json:"is_active"`
	UnitID   *uint  `json:"unit_id"`
}

// UserHandler handles user routes
type UserHandler struct {
	userService services.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// List handles listing users for the active tenant with pagination
// GET /api/users?page=1&per_page=10&search=...
func (h *UserHandler) List(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	if perPage < 1 {
		perPage = 10
	}
	search := c.Query("search")

	userTenants, total, err := h.userService.ListByTenant(tenantID, page, perPage, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	// Transform to flat response
	items := make([]UserListItem, 0, len(userTenants))
	for _, ut := range userTenants {
		if ut.User == nil {
			continue
		}
		items = append(items, UserListItem{
			ID:       ut.User.ID,
			Name:     ut.User.Name,
			Email:    ut.User.Email,
			Phone:    ut.User.Phone,
			Role:     string(ut.Role),
			IsActive: ut.IsActive,
			UnitID:   ut.User.UnitID,
		})
	}

	totalPages := int(math.Ceil(float64(total) / float64(perPage)))

	c.JSON(http.StatusOK, gin.H{
		"data":        items,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": totalPages,
	})
}

// GetByID handles getting a user by ID (tenant-aware)
// GET /api/users/:id
func (h *UserHandler) GetByID(c *gin.Context) {
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
			"message": "invalid user ID",
		})
		return
	}

	userInTenant, err := h.userService.GetByIDInTenant(tenantID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": userInTenant,
	})
}

// UpdateMembership handles updating tenant-specific user data (is_active, unit_id)
// PATCH /api/users/:id/membership
func (h *UserHandler) UpdateMembership(c *gin.Context) {
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
			"message": "invalid user ID",
		})
		return
	}

	var req struct {
		IsActive *bool `json:"is_active"`
		UnitID   *uint `json:"unit_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Default is_active to true if not provided
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	if err := h.userService.UpdateMembership(tenantID, uint(id), isActive, req.UnitID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "membership updated successfully",
	})
}

// RemoveFromTenant removes a user's membership from the current tenant
// DELETE /api/users/:id
func (h *UserHandler) RemoveFromTenant(c *gin.Context) {
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
			"message": "invalid user ID",
		})
		return
	}

	if err := h.userService.RemoveFromTenant(tenantID, uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user removed from tenant successfully",
	})
}

// RegisterRoutes registers user routes
func (h *UserHandler) RegisterRoutes(router *gin.RouterGroup) {
	users := router.Group("/users")
	{
		users.GET("", h.List)
		users.GET("/:id", h.GetByID)
		users.PATCH("/:id/membership", h.UpdateMembership)
		users.DELETE("/:id", h.RemoveFromTenant)
	}
}
