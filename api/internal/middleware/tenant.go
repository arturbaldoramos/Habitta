package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// TenantMiddleware validates that user has an active tenant in context
// This middleware requires AuthMiddleware to run first
func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get active_tenant_id from context (should be set by AuthMiddleware)
		tenantID, exists := c.Get("active_tenant_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"message": "Active tenant required",
			})
			c.Abort()
			return
		}

		// Validate active_tenant_id
		tenantIDUint, ok := tenantID.(uint)
		if !ok || tenantIDUint == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"message": "Invalid tenant ID",
			})
			c.Abort()
			return
		}

		// Tenant ID is valid, continue
		c.Next()
	}
}

// OptionalTenantMiddleware allows access with or without an active tenant
// This is useful for endpoints that work differently based on tenant context
func OptionalTenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Just pass through - tenant may or may not be present in context
		c.Next()
	}
}

// GetTenantID is a helper function to extract active_tenant_id from context
func GetTenantID(c *gin.Context) (uint, bool) {
	tenantID, exists := c.Get("active_tenant_id")
	if !exists {
		return 0, false
	}

	tenantIDUint, ok := tenantID.(uint)
	return tenantIDUint, ok
}

// GetActiveRole is a helper function to extract active_role from context
func GetActiveRole(c *gin.Context) (string, bool) {
	role, exists := c.Get("active_role")
	if !exists {
		return "", false
	}

	roleStr, ok := role.(string)
	return roleStr, ok
}

// GetUserID is a helper function to extract user_id from context
func GetUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	userIDUint, ok := userID.(uint)
	return userIDUint, ok
}
