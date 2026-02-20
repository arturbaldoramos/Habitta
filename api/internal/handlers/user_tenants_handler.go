package handlers

import (
	"net/http"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"github.com/gin-gonic/gin"
)

// UserTenantsHandler handles user-tenants routes
type UserTenantsHandler struct {
	userTenantRepo repositories.UserTenantRepository
}

// NewUserTenantsHandler creates a new user-tenants handler
func NewUserTenantsHandler(userTenantRepo repositories.UserTenantRepository) *UserTenantsHandler {
	return &UserTenantsHandler{
		userTenantRepo: userTenantRepo,
	}
}

// GetMyTenants handles retrieving all tenants for the authenticated user
// GET /api/users/me/tenants
func (h *UserTenantsHandler) GetMyTenants(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "user not found in context",
		})
		return
	}

	userTenants, err := h.userTenantRepo.GetAllByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": userTenants,
	})
}
