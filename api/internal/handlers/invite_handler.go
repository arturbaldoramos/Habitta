package handlers

import (
	"net/http"
	"strconv"

	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

// InviteHandler handles invite routes
type InviteHandler struct {
	inviteService services.InviteService
}

// NewInviteHandler creates a new invite handler
func NewInviteHandler(inviteService services.InviteService) *InviteHandler {
	return &InviteHandler{
		inviteService: inviteService,
	}
}

// CreateInvite handles creating a new invite (requires active tenant, síndico/admin only)
// POST /api/invites
func (h *InviteHandler) CreateInvite(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "user not found in context",
		})
		return
	}

	tenantID, exists := middleware.GetTenantID(c)
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "active tenant required",
		})
		return
	}

	var req services.CreateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	invite, err := h.inviteService.CreateInvite(tenantID, userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": invite,
	})
}

// GetInviteByToken handles retrieving an invite by token (public endpoint)
// GET /api/invites/:token
func (h *InviteHandler) GetInviteByToken(c *gin.Context) {
	token := c.Param("token")

	invite, err := h.inviteService.GetInviteByToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": invite,
	})
}

// AcceptInvite handles accepting an invite (public endpoint)
// POST /api/invites/:token/accept
func (h *InviteHandler) AcceptInvite(c *gin.Context) {
	token := c.Param("token")

	var req services.AcceptInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	user, err := h.inviteService.AcceptInvite(token, req)
	if err != nil {
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

// GetMyPendingInvites handles retrieving pending invites for the authenticated user
// GET /api/invites/me
func (h *InviteHandler) GetMyPendingInvites(c *gin.Context) {
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "email not found in context",
		})
		return
	}

	emailStr, ok := email.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "invalid email format",
		})
		return
	}

	invites, err := h.inviteService.GetPendingInvitesByEmail(emailStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": invites,
	})
}

// CancelInvite handles cancelling an invite (requires active tenant)
// DELETE /api/invites/:id
func (h *InviteHandler) CancelInvite(c *gin.Context) {
	inviteIDStr := c.Param("id")
	inviteID, err := strconv.ParseUint(inviteIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "invalid invite ID format",
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

	tenantID, exists := middleware.GetTenantID(c)
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "active tenant required",
		})
		return
	}

	if err := h.inviteService.CancelInvite(uint(inviteID), userID, tenantID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "invite cancelled successfully",
	})
}

// GetTenantInvites handles retrieving all invites for the active tenant
// GET /api/tenants/invites
func (h *InviteHandler) GetTenantInvites(c *gin.Context) {
	tenantID, exists := middleware.GetTenantID(c)
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "active tenant required",
		})
		return
	}

	invites, err := h.inviteService.GetTenantInvites(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": invites,
	})
}
