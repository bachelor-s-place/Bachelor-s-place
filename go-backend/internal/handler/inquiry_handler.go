package handler

import (
	"encoding/json"
	"net/http"

	"bachelorsSpace/internal/domain/inquiry"
	"bachelorsSpace/internal/middleware"
	"bachelorsSpace/internal/pkg/apierror"
	"bachelorsSpace/internal/pkg/respond"

	"github.com/go-chi/chi/v5"
	"github.com/microcosm-cc/bluemonday"
)

// InquiryHandler exposes the tenant<->landlord inquiry channel.
type InquiryHandler struct {
	svc       *inquiry.Service
	sanitizer *bluemonday.Policy
}

func NewInquiryHandler(svc *inquiry.Service) *InquiryHandler {
	return &InquiryHandler{svc: svc, sanitizer: bluemonday.StrictPolicy()}
}

func (h *InquiryHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Start)
	r.Get("/{id}", h.GetThread)
	r.Post("/{id}/messages", h.PostMessage)
	return r
}

// Start handles POST /api/v1/inquiries  { property_id, message }
func (h *InquiryHandler) Start(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())

	var input struct {
		PropertyID string `json:"property_id"`
		Message    string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respond.Error(w, apierror.ValidationError("invalid JSON body"))
		return
	}
	if input.PropertyID == "" {
		respond.Error(w, apierror.ValidationError("property_id is required"))
		return
	}

	thread, msg, err := h.svc.StartInquiry(r.Context(), userID, input.PropertyID, h.sanitizer.Sanitize(input.Message))
	if err != nil {
		respond.Error(w, err)
		return
	}
	respond.JSON(w, http.StatusCreated, map[string]interface{}{"inquiry": thread, "message": msg})
}

// List handles GET /api/v1/inquiries — threads the caller participates in.
func (h *InquiryHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())

	list, err := h.svc.ListInquiries(r.Context(), userID)
	if err != nil {
		respond.Error(w, err)
		return
	}
	if list == nil {
		list = []*inquiry.Inquiry{}
	}
	respond.JSON(w, http.StatusOK, map[string]interface{}{"inquiries": list, "count": len(list)})
}

// GetThread handles GET /api/v1/inquiries/{id}
func (h *InquiryHandler) GetThread(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")

	thread, msgs, err := h.svc.GetThread(r.Context(), userID, id)
	if err != nil {
		respond.Error(w, err)
		return
	}
	if msgs == nil {
		msgs = []*inquiry.Message{}
	}
	respond.JSON(w, http.StatusOK, map[string]interface{}{"inquiry": thread, "messages": msgs})
}

// PostMessage handles POST /api/v1/inquiries/{id}/messages  { message }
func (h *InquiryHandler) PostMessage(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")

	var input struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respond.Error(w, apierror.ValidationError("invalid JSON body"))
		return
	}

	msg, err := h.svc.PostMessage(r.Context(), userID, id, h.sanitizer.Sanitize(input.Message))
	if err != nil {
		respond.Error(w, err)
		return
	}
	respond.JSON(w, http.StatusCreated, map[string]interface{}{"message": msg})
}
