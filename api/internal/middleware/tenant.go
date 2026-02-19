package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// TenantMiddleware extracts tenant_id from context (set by AuthMiddleware) and validates it
func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get tenant_id from context (should be set by AuthMiddleware)
		tenantID, exists := c.Get("tenant_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Forbidden",
				"message": "Tenant ID not found in token",
			})
			c.Abort()
			return
		}

		// Validate tenant_id
		tenantIDUint, ok := tenantID.(uint)
		if !ok || tenantIDUint == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Forbidden",
				"message": "Invalid tenant ID",
			})
			c.Abort()
			return
		}

		// Tenant ID is valid, continue
		c.Next()
	}
}

// GetTenantID is a helper function to extract tenant_id from context
func GetTenantID(c *gin.Context) (uint, bool) {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return 0, false
	}

	tenantIDUint, ok := tenantID.(uint)
	return tenantIDUint, ok
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
