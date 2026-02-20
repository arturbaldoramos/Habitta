package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/arturbaldoramos/Habitta/internal/config"
)

// EmailMessage represents an email to be sent
type EmailMessage struct {
	To      string
	Subject string
	HTML    string
}

// EmailService defines the interface for sending emails
type EmailService interface {
	SendEmail(msg EmailMessage) error
}

// consoleEmailService logs emails to the console (development)
type consoleEmailService struct{}

func (s *consoleEmailService) SendEmail(msg EmailMessage) error {
	log.Printf("[EMAIL] To: %s | Subject: %s\n%s", msg.To, msg.Subject, msg.HTML)
	return nil
}

// resendEmailService sends emails via Resend API (staging/production)
type resendEmailService struct {
	apiKey      string
	fromAddress string
}

func (s *resendEmailService) SendEmail(msg EmailMessage) error {
	payload := map[string]interface{}{
		"from":    s.fromAddress,
		"to":      []string{msg.To},
		"subject": msg.Subject,
		"html":    msg.HTML,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email via Resend: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// NewEmailService creates the appropriate email service based on environment
func NewEmailService(cfg *config.Config) EmailService {
	if cfg.Server.Env == "development" {
		log.Println("Using console email service (development mode)")
		return &consoleEmailService{}
	}

	log.Println("Using Resend email service")
	return &resendEmailService{
		apiKey:      cfg.Email.ResendAPIKey,
		fromAddress: cfg.Email.FromAddress,
	}
}
