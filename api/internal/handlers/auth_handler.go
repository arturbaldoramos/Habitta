package handlers

import (
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication routes
type AuthHandler struct {
	authService services.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Login handles user login (returns tenants if multiple, token if single/none)
// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	response, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// LoginWithTenant handles user login with specific tenant selection
// POST /api/auth/login/tenant/:tenant_id
func (h *AuthHandler) LoginWithTenant(c *gin.Context) {
	tenantIDStr := c.Param("tenant_id")
	tenantID, err := strconv.ParseUint(tenantIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid tenant_id format",
		})
		return
	}

	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	response, err := h.authService.LoginWithTenant(req.Email, req.Password, uint(tenantID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// Register handles user registration (creates orphan user)
// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	user, err := h.authService.Register(req)
	if err != nil {
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

// SwitchTenant handles switching active tenant
// POST /api/auth/switch-tenant/:tenant_id
func (h *AuthHandler) SwitchTenant(c *gin.Context) {
	tenantIDStr := c.Param("tenant_id")
	tenantID, err := strconv.ParseUint(tenantIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid tenant_id format",
		})
		return
	}

	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "user not found in context",
		})
		return
	}

	token, err := h.authService.SwitchTenant(userID, uint(tenantID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"token": token,
		},
	})
}

// RegisterRoutes registers auth routes
func (h *AuthHandler) RegisterRoutes(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	{
		auth.POST("/login", h.Login)
		auth.POST("/login/tenant/:tenant_id", h.LoginWithTenant)
		auth.POST("/register", h.Register)
	}
}
