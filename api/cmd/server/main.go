package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arturbaldoramos/Habitta/internal/config"
	"github.com/arturbaldoramos/Habitta/internal/database"
	"github.com/arturbaldoramos/Habitta/internal/handlers"
	"github.com/arturbaldoramos/Habitta/internal/middleware"
	"github.com/arturbaldoramos/Habitta/internal/models"
	"github.com/arturbaldoramos/Habitta/internal/repositories"
	"github.com/arturbaldoramos/Habitta/internal/services"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	log.Println("Loading configuration...")
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	log.Printf("Configuration loaded successfully (env: %s)", cfg.Server.Env)

	// Initialize database
	log.Println("Initializing database connection...")
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Println("Database connection established")

	// Run migrations
	log.Println("Running database migrations...")
	if err := database.AutoMigrate(db, &models.Tenant{}, &models.User{}, &models.Unit{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed")

	// Initialize repositories
	tenantRepo := repositories.NewTenantRepository(db)
	userRepo := repositories.NewUserRepository(db)
	unitRepo := repositories.NewUnitRepository(db)
	log.Println("Repositories initialized")

	// Initialize services
	authService := services.NewAuthService(userRepo, tenantRepo, cfg)
	tenantService := services.NewTenantService(tenantRepo)
	userService := services.NewUserService(userRepo, tenantRepo)
	unitService := services.NewUnitService(unitRepo, tenantRepo)
	log.Println("Services initialized")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	tenantHandler := handlers.NewTenantHandler(tenantService)
	userHandler := handlers.NewUserHandler(userService)
	unitHandler := handlers.NewUnitHandler(unitService)
	log.Println("Handlers initialized")

	// Setup Gin router
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.New()

	// Global middlewares (apply to all routes)
	router.Use(middleware.CORSMiddleware(cfg.CORS.AllowedOrigins))
	router.Use(middleware.LoggerMiddleware())
	router.Use(gin.Recovery())

	// Health check endpoint (no auth required)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"time":   time.Now().UTC(),
		})
	})

	// API routes
	api := router.Group("/api")
	{
		// Public routes (no authentication required)
		authHandler.RegisterRoutes(api)

		// Protected routes (authentication required)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		protected.Use(middleware.TenantMiddleware())
		{
			// User routes (tenant-isolated)
			userHandler.RegisterRoutes(protected)

			// Unit routes (tenant-isolated)
			unitHandler.RegisterRoutes(protected)
		}

		// Admin routes (authentication required, no tenant isolation)
		admin := api.Group("")
		admin.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		admin.Use(middleware.RequireRole("admin"))
		{
			// Tenant routes (admin only)
			tenantHandler.RegisterRoutes(admin)
		}
	}

	log.Println("Routes registered successfully")

	// Create HTTP server
	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on %s", addr)
		log.Printf("Environment: %s", cfg.Server.Env)
		log.Printf("CORS allowed origins: %s", cfg.CORS.AllowedOrigins)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown with 5 second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	// Close database connection
	if err := database.Close(db); err != nil {
		log.Printf("Error closing database connection: %v", err)
	}

	log.Println("Server exited")
}
