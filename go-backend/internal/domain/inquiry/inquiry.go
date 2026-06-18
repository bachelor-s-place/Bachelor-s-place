// Package inquiry implements the contact-masked tenant<->landlord pre-booking chat.
// No phone/contact details are ever exposed here — that remains gated behind a locked
// squad (BR-06). Inquiries are purely in-app messages about a specific property.
package inquiry

import (
	"context"
	"net/http"
	"strings"
	"time"

	"bachelorsSpace/internal/pkg/apierror"
)

// Inquiry is a single thread between a tenant and a landlord about one property.
type Inquiry struct {
	ID            string    `json:"id"`
	PropertyID    string    `json:"property_id"`
	PropertyTitle string    `json:"property_title,omitempty"`
	TenantID      string    `json:"tenant_id"`
	TenantName    string    `json:"tenant_name,omitempty"`
	LandlordID    string    `json:"landlord_id"`
	LandlordName  string    `json:"landlord_name,omitempty"`
	LastMessage   string    `json:"last_message,omitempty"`
	LastMessageAt time.Time `json:"last_message_at"`
	CreatedAt     time.Time `json:"created_at"`
}

// Message is a single message within an inquiry thread.
type Message struct {
	ID         string    `json:"id"`
	InquiryID  string    `json:"inquiry_id"`
	SenderID   string    `json:"sender_id"`
	SenderName string    `json:"sender_name,omitempty"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"created_at"`
}

// Repository defines the data operations the inquiry service needs.
type Repository interface {
	GetPropertyOwner(ctx context.Context, propertyID string) (ownerID string, err error)
	FindOrCreateThread(ctx context.Context, propertyID, tenantID, landlordID string) (string, error)
	AddMessage(ctx context.Context, inquiryID, senderID, body string) (*Message, error)
	GetThreadByID(ctx context.Context, inquiryID string) (*Inquiry, error)
	GetMessages(ctx context.Context, inquiryID string) ([]*Message, error)
	ListForUser(ctx context.Context, userID string) ([]*Inquiry, error)
}

// Service holds inquiry business logic.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

var (
	ErrPropertyNotFound = apierror.NotFound("property not found")
	ErrInquiryNotFound  = apierror.NotFound("inquiry not found")
	ErrEmptyMessage     = apierror.ValidationError("message cannot be empty")
	ErrOwnProperty      = apierror.New(http.StatusUnprocessableEntity, "OWN_PROPERTY", "you cannot send an inquiry about your own property")
	ErrForbidden        = apierror.Forbidden("you are not a participant in this inquiry")
)

const maxMessageLen = 2000

// StartInquiry creates (or reuses) the tenant's thread for a property and posts the first
// message. The landlord is derived from the property owner — the tenant never picks it.
func (s *Service) StartInquiry(ctx context.Context, tenantID, propertyID, body string) (*Inquiry, *Message, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, nil, ErrEmptyMessage
	}
	if len(body) > maxMessageLen {
		body = body[:maxMessageLen]
	}

	landlordID, err := s.repo.GetPropertyOwner(ctx, propertyID)
	if err != nil {
		return nil, nil, ErrPropertyNotFound
	}
	if landlordID == tenantID {
		return nil, nil, ErrOwnProperty
	}

	inquiryID, err := s.repo.FindOrCreateThread(ctx, propertyID, tenantID, landlordID)
	if err != nil {
		return nil, nil, apierror.Internal("failed to open inquiry")
	}

	msg, err := s.repo.AddMessage(ctx, inquiryID, tenantID, body)
	if err != nil {
		return nil, nil, apierror.Internal("failed to send message")
	}

	thread, err := s.repo.GetThreadByID(ctx, inquiryID)
	if err != nil {
		return nil, nil, apierror.Internal("failed to load inquiry")
	}
	return thread, msg, nil
}

// PostMessage posts a message to an existing thread. Only the thread's tenant or landlord
// may post.
func (s *Service) PostMessage(ctx context.Context, userID, inquiryID, body string) (*Message, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, ErrEmptyMessage
	}
	if len(body) > maxMessageLen {
		body = body[:maxMessageLen]
	}

	thread, err := s.repo.GetThreadByID(ctx, inquiryID)
	if err != nil {
		return nil, ErrInquiryNotFound
	}
	if userID != thread.TenantID && userID != thread.LandlordID {
		return nil, ErrForbidden
	}

	msg, err := s.repo.AddMessage(ctx, inquiryID, userID, body)
	if err != nil {
		return nil, apierror.Internal("failed to send message")
	}
	return msg, nil
}

// GetThread returns a thread and its messages for a participant (tenant or landlord).
func (s *Service) GetThread(ctx context.Context, userID, inquiryID string) (*Inquiry, []*Message, error) {
	thread, err := s.repo.GetThreadByID(ctx, inquiryID)
	if err != nil {
		return nil, nil, ErrInquiryNotFound
	}
	if userID != thread.TenantID && userID != thread.LandlordID {
		return nil, nil, ErrForbidden
	}
	msgs, err := s.repo.GetMessages(ctx, inquiryID)
	if err != nil {
		return nil, nil, apierror.Internal("failed to load messages")
	}
	return thread, msgs, nil
}

// ListInquiries returns all threads the user participates in (as tenant or landlord).
func (s *Service) ListInquiries(ctx context.Context, userID string) ([]*Inquiry, error) {
	list, err := s.repo.ListForUser(ctx, userID)
	if err != nil {
		return nil, apierror.Internal("failed to load inquiries")
	}
	return list, nil
}
