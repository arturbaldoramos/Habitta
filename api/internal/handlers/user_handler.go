package handlers

import (
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

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

// Create handles user creation
// POST /api/users
func (h *UserHandler) Create(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Override tenant_id from context for security
	user.TenantID = tenantID

	if err := h.userService.Create(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": user,
	})
}

// GetByID handles getting a user by ID
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

	user, err := h.userService.GetByID(tenantID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

// GetAll handles getting all users for a tenant
// GET /api/users
func (h *UserHandler) GetAll(c *gin.Context) {
	tenantID, ok := middleware.GetTenantID(c)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "tenant_id not found in context",
		})
		return
	}

	// Optional: filter by role
	roleParam := c.Query("role")
	if roleParam != "" {
		users, err := h.userService.GetByRole(tenantID, models.UserRole(roleParam))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Internal Server Error",
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": users,
		})
		return
	}

	users, err := h.userService.GetAll(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": users,
	})
}

// Update handles user update
// PUT /api/users/:id
func (h *UserHandler) Update(c *gin.Context) {
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

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Override tenant_id and user_id from context/params for security
	user.ID = uint(id)
	user.TenantID = tenantID

	if err := h.userService.Update(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

// UpdatePassword handles user password update
// PATCH /api/users/:id/password
func (h *UserHandler) UpdatePassword(c *gin.Context) {
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
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	if err := h.userService.UpdatePassword(tenantID, uint(id), req.OldPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "password updated successfully",
	})
}

// Delete handles user deletion
// DELETE /api/users/:id
func (h *UserHandler) Delete(c *gin.Context) {
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

	if err := h.userService.Delete(tenantID, uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user deleted successfully",
	})
}

// RegisterRoutes registers user routes
func (h *UserHandler) RegisterRoutes(router *gin.RouterGroup) {
	users := router.Group("/users")
	{
		users.POST("", h.Create)
		users.GET("", h.GetAll)
		users.GET("/:id", h.GetByID)
		users.PUT("/:id", h.Update)
		users.PATCH("/:id/password", h.UpdatePassword)
		users.DELETE("/:id", h.Delete)
	}
}
