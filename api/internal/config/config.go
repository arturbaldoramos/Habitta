package config

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	CORS     CORSConfig
	Email    EmailConfig
	Storage  StorageConfig
}

// StorageConfig holds S3/MinIO storage configuration
type StorageConfig struct {
	Endpoint     string
	Bucket       string
	Region       string
	AccessKey    string
	SecretKey    string
	UsePathStyle bool
}

// EmailConfig holds email service configuration
type EmailConfig struct {
	ResendAPIKey string
	FromAddress  string
	AppBaseURL   string
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port string
	Env  string
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret          string
	ExpirationHours int
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins string
}

// LoadConfig reads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Set config file name and type
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")

	// Allow viper to read environment variables
	viper.AutomaticEnv()

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Could not read config file: %v", err)
		log.Println("Using environment variables only")
	}

	// Set defaults
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENV", "development")
	viper.SetDefault("DATABASE_HOST", "localhost")
	viper.SetDefault("DATABASE_PORT", "5432")
	viper.SetDefault("DATABASE_SSL_MODE", "disable")
	viper.SetDefault("JWT_EXPIRATION_HOURS", 24)
	viper.SetDefault("ALLOWED_ORIGINS", "http://localhost:4200")
	viper.SetDefault("EMAIL_FROM", "noreply@habitta.com")
	viper.SetDefault("APP_BASE_URL", "http://localhost:4200")
	viper.SetDefault("S3_ENDPOINT", "http://localhost:9000")
	viper.SetDefault("S3_BUCKET", "habitta-local")
	viper.SetDefault("S3_REGION", "us-east-1")
	viper.SetDefault("S3_ACCESS_KEY", "minioadmin")
	viper.SetDefault("S3_SECRET_KEY", "minioadmin")
	viper.SetDefault("S3_USE_PATH_STYLE", true)

	config := &Config{
		Server: ServerConfig{
			Port: viper.GetString("PORT"),
			Env:  viper.GetString("ENV"),
		},
		Database: DatabaseConfig{
			Host:     viper.GetString("DATABASE_HOST"),
			Port:     viper.GetString("DATABASE_PORT"),
			User:     viper.GetString("DATABASE_USER"),
			Password: viper.GetString("DATABASE_PASSWORD"),
			Name:     viper.GetString("DATABASE_NAME"),
			SSLMode:  viper.GetString("DATABASE_SSL_MODE"),
		},
		JWT: JWTConfig{
			Secret:          viper.GetString("JWT_SECRET"),
			ExpirationHours: viper.GetInt("JWT_EXPIRATION_HOURS"),
		},
		CORS: CORSConfig{
			AllowedOrigins: viper.GetString("ALLOWED_ORIGINS"),
		},
		Email: EmailConfig{
			ResendAPIKey: viper.GetString("RESEND_API_KEY"),
			FromAddress:  viper.GetString("EMAIL_FROM"),
			AppBaseURL:   viper.GetString("APP_BASE_URL"),
		},
		Storage: StorageConfig{
			Endpoint:     viper.GetString("S3_ENDPOINT"),
			Bucket:       viper.GetString("S3_BUCKET"),
			Region:       viper.GetString("S3_REGION"),
			AccessKey:    viper.GetString("S3_ACCESS_KEY"),
			SecretKey:    viper.GetString("S3_SECRET_KEY"),
			UsePathStyle: viper.GetBool("S3_USE_PATH_STYLE"),
		},
	}

	// Validate required fields
	if err := config.Validate(); err != nil {
		return nil, err
	}

	return config, nil
}

// Validate checks if all required configuration values are present
func (c *Config) Validate() error {
	if c.Database.User == "" {
		return fmt.Errorf("DATABASE_USER is required")
	}
	if c.Database.Password == "" {
		return fmt.Errorf("DATABASE_PASSWORD is required")
	}
	if c.Database.Name == "" {
		return fmt.Errorf("DATABASE_NAME is required")
	}
	if c.JWT.Secret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if c.Server.Env != "development" && c.Email.ResendAPIKey == "" {
		return fmt.Errorf("RESEND_API_KEY is required in non-development environments")
	}
	return nil
}

// GetDSN returns the PostgreSQL connection string
func (c *Config) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.SSLMode,
	)
}
