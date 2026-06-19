package handler

import (
	"encoding/json"
	"net/http"

	"bachelorsSpace/internal/domain/user"
	"bachelorsSpace/internal/middleware"
	"bachelorsSpace/internal/pkg/apierror"
	"bachelorsSpace/internal/pkg/respond"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/rs/zerolog/log"
)

// UserHandler handles user profile HTTP requests.
type UserHandler struct {
	svc      *user.Service
	validate *validator.Validate
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(svc *user.Service) *UserHandler {
	return &UserHandler{
		svc:      svc,
		validate: validator.New(),
	}
}

// GetProfile handles GET /api/v1/users/me
func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	
	log.Info().Str("user_id", userID).Msg("GetProfile: fetching user from DB")

	u, err := h.svc.GetUserByID(r.Context(), userID)
	if err != nil {
		log.Error().Err(err).Msg("GetProfile: GetUserByID failed")
		respond.Error(w, user.ToAPIError(err))
		return
	}

	log.Info().Str("user_id", u.ID).Msg("GetProfile: fetch successful, encoding JSON")
	respond.JSON(w, http.StatusOK, u)
}

// UpdateProfile handles PUT /api/v1/users/me/profile
func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())

	var input user.UpdateProfileInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respond.Error(w, apierror.ValidationError("invalid JSON body"))
		return
	}
	if err := h.validate.Struct(input); err != nil {
		respond.Error(w, apierror.ValidationError(err.Error()))
		return
	}

	if err := h.svc.UpdateProfile(r.Context(), userID, input); err != nil {
		respond.Error(w, user.ToAPIError(err))
		return
	}

	// Fetch updated profile to return
	u, err := h.svc.GetUserByID(r.Context(), userID)
	if err != nil {
		respond.Error(w, user.ToAPIError(err))
		return
	}

	respond.JSON(w, http.StatusOK, u)
}

// UpdateContact handles PUT /api/v1/users/me/contact
// Stores the user's (landlord's) contact phone and optional WhatsApp number, encrypted.
func (h *UserHandler) UpdateContact(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())

	var input user.UpdateContactInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respond.Error(w, apierror.ValidationError("invalid JSON body"))
		return
	}
	if err := h.validate.Struct(input); err != nil {
		respond.Error(w, apierror.ValidationError(err.Error()))
		return
	}

	if err := h.svc.UpdateContact(r.Context(), userID, input); err != nil {
		respond.Error(w, user.ToAPIError(err))
		return
	}

	u, err := h.svc.GetUserByID(r.Context(), userID)
	if err != nil {
		respond.Error(w, user.ToAPIError(err))
		return
	}
	respond.JSON(w, http.StatusOK, u)
}

// Routes returns a chi.Router with all user profile routes mounted.
func (h *UserHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/me", h.GetProfile)
	r.Put("/me/profile", h.UpdateProfile)
	r.Put("/me/contact", h.UpdateContact)
	return r
}
