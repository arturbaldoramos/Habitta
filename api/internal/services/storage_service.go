package services

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/arturbaldoramos/Habitta/internal/config"
	awsconfig "github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// StorageService defines the interface for file storage operations
type StorageService interface {
	Upload(ctx context.Context, key string, body io.Reader, contentType string, size int64) error
	Delete(ctx context.Context, key string) error
	GetPresignedURL(ctx context.Context, key string, duration time.Duration) (string, error)
}

// s3StorageService implements StorageService using AWS S3
type s3StorageService struct {
	client       *s3.Client
	presignClient *s3.PresignClient
	bucket       string
}

// NewStorageService creates a new S3/MinIO storage service
func NewStorageService(cfg config.StorageConfig) (StorageService, error) {
	opts := []func(*s3.Options){
		func(o *s3.Options) {
			o.Region = cfg.Region
			o.Credentials = credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, "")
			o.UsePathStyle = cfg.UsePathStyle
		},
	}

	if cfg.Endpoint != "" {
		opts = append(opts, func(o *s3.Options) {
			o.BaseEndpoint = awsconfig.String(cfg.Endpoint)
		})
	}

	client := s3.New(s3.Options{}, opts...)
	presignClient := s3.NewPresignClient(client)

	svc := &s3StorageService{
		client:        client,
		presignClient: presignClient,
		bucket:        cfg.Bucket,
	}

	// Ensure bucket exists (useful for MinIO local dev)
	if err := svc.ensureBucket(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ensure bucket exists: %w", err)
	}

	return svc, nil
}

// ensureBucket creates the bucket if it doesn't exist
func (s *s3StorageService) ensureBucket(ctx context.Context) error {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: &s.bucket,
	})
	if err == nil {
		return nil
	}

	_, err = s.client.CreateBucket(ctx, &s3.CreateBucketInput{
		Bucket: &s.bucket,
	})
	if err != nil {
		return fmt.Errorf("failed to create bucket %s: %w", s.bucket, err)
	}

	return nil
}

// Upload uploads a file to S3
func (s *s3StorageService) Upload(ctx context.Context, key string, body io.Reader, contentType string, size int64) error {
	input := &s3.PutObjectInput{
		Bucket:        &s.bucket,
		Key:           &key,
		Body:          body,
		ContentType:   &contentType,
		ContentLength: &size,
	}

	_, err := s.client.PutObject(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to upload object: %w", err)
	}

	return nil
}

// Delete removes a file from S3
func (s *s3StorageService) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
	})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}

	return nil
}

// GetPresignedURL generates a presigned URL for downloading a file
func (s *s3StorageService) GetPresignedURL(ctx context.Context, key string, duration time.Duration) (string, error) {
	result, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
	}, s3.WithPresignExpires(duration))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return result.URL, nil
}
