package utils

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const (
	// DefaultCost is the default bcrypt cost for password hashing
	DefaultCost = bcrypt.DefaultCost
)

// HashPassword generates a bcrypt hash from a plain text password
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", fmt.Errorf("password cannot be empty")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hashedBytes), nil
}

// CheckPassword compares a plain text password with a hashed password
func CheckPassword(password, hashedPassword string) error {
	if password == "" {
		return fmt.Errorf("password cannot be empty")
	}

	if hashedPassword == "" {
		return fmt.Errorf("hashed password cannot be empty")
	}

	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		return fmt.Errorf("invalid password")
	}

	return nil
}

// IsPasswordValid checks if a password meets minimum requirements
func IsPasswordValid(password string) error {
	if len(password) < 6 {
		return fmt.Errorf("password must be at least 6 characters long")
	}

	if len(password) > 72 {
		return fmt.Errorf("password must be at most 72 characters long")
	}

	return nil
}
