package handlers

import (
	"net/http"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// AccountHandler handles account routes for the authenticated user
type AccountHandler struct {
	userService services.UserService
}

// NewAccountHandler creates a new account handler
func NewAccountHandler(userService services.UserService) *AccountHandler {
	return &AccountHandler{
		userService: userService,
	}
}

// GetAccount returns the authenticated user's data
// GET /api/account
func (h *AccountHandler) GetAccount(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "user_id not found in context",
		})
		return
	}

	user, err := h.userService.GetByID(userID)
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

// UpdateAccount updates the authenticated user's profile data
// PATCH /api/account
func (h *AccountHandler) UpdateAccount(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "user_id not found in context",
		})
		return
	}

	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	user, err := h.userService.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": err.Error(),
		})
		return
	}

	// Validate phone length (format: (99) 99999-9999 = 15 chars)
	if req.Phone != "" && len(req.Phone) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "phone must be at most 20 characters",
		})
		return
	}

	user.Name = req.Name
	user.Phone = req.Phone

	if err := h.userService.Update(user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Clear password before returning
	user.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

// UpdatePassword updates the authenticated user's password
// PATCH /api/account/password
func (h *AccountHandler) UpdatePassword(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "user_id not found in context",
		})
		return
	}

	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	if err := h.userService.UpdatePassword(userID, req.OldPassword, req.NewPassword); err != nil {
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

// RegisterRoutes registers account routes
func (h *AccountHandler) RegisterRoutes(router *gin.RouterGroup) {
	account := router.Group("/account")
	{
		account.GET("", h.GetAccount)
		account.PATCH("", h.UpdateAccount)
		account.PATCH("/password", h.UpdatePassword)
	}
}
