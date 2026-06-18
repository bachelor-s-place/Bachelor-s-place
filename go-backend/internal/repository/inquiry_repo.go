package repository

import (
	"context"

	"bachelorsSpace/internal/domain/inquiry"

	"github.com/jackc/pgx/v5/pgxpool"
)

type InquiryRepo struct {
	pool *pgxpool.Pool
}

func NewInquiryRepo(pool *pgxpool.Pool) *InquiryRepo {
	return &InquiryRepo{pool: pool}
}

func (r *InquiryRepo) GetPropertyOwner(ctx context.Context, propertyID string) (string, error) {
	var owner string
	err := r.pool.QueryRow(ctx,
		`SELECT owner_id FROM properties WHERE id = $1 AND deleted_at IS NULL`, propertyID,
	).Scan(&owner)
	return owner, err
}

// FindOrCreateThread returns the existing thread for (property, tenant), or creates one.
func (r *InquiryRepo) FindOrCreateThread(ctx context.Context, propertyID, tenantID, landlordID string) (string, error) {
	const query = `
		INSERT INTO property_inquiries (property_id, tenant_id, landlord_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (property_id, tenant_id)
		DO UPDATE SET last_message_at = property_inquiries.last_message_at
		RETURNING id`
	var id string
	err := r.pool.QueryRow(ctx, query, propertyID, tenantID, landlordID).Scan(&id)
	return id, err
}

func (r *InquiryRepo) AddMessage(ctx context.Context, inquiryID, senderID, body string) (*inquiry.Message, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	const insert = `
		INSERT INTO inquiry_messages (inquiry_id, sender_id, body)
		VALUES ($1, $2, $3)
		RETURNING id, inquiry_id, sender_id, body, created_at`
	var m inquiry.Message
	if err := tx.QueryRow(ctx, insert, inquiryID, senderID, body).Scan(
		&m.ID, &m.InquiryID, &m.SenderID, &m.Body, &m.CreatedAt,
	); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx,
		`UPDATE property_inquiries SET last_message_at = NOW() WHERE id = $1`, inquiryID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *InquiryRepo) GetThreadByID(ctx context.Context, inquiryID string) (*inquiry.Inquiry, error) {
	const query = `
		SELECT i.id, i.property_id, p.title, i.tenant_id, t.name, i.landlord_id, l.name,
		       i.last_message_at, i.created_at
		FROM   property_inquiries i
		JOIN   properties p ON p.id = i.property_id
		JOIN   users t ON t.id = i.tenant_id
		JOIN   users l ON l.id = i.landlord_id
		WHERE  i.id = $1`
	var in inquiry.Inquiry
	err := r.pool.QueryRow(ctx, query, inquiryID).Scan(
		&in.ID, &in.PropertyID, &in.PropertyTitle, &in.TenantID, &in.TenantName,
		&in.LandlordID, &in.LandlordName, &in.LastMessageAt, &in.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &in, nil
}

func (r *InquiryRepo) GetMessages(ctx context.Context, inquiryID string) ([]*inquiry.Message, error) {
	const query = `
		SELECT m.id, m.inquiry_id, m.sender_id, u.name, m.body, m.created_at
		FROM   inquiry_messages m
		JOIN   users u ON u.id = m.sender_id
		WHERE  m.inquiry_id = $1
		ORDER BY m.created_at ASC`
	rows, err := r.pool.Query(ctx, query, inquiryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []*inquiry.Message
	for rows.Next() {
		var m inquiry.Message
		if err := rows.Scan(&m.ID, &m.InquiryID, &m.SenderID, &m.SenderName, &m.Body, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, &m)
	}
	return msgs, rows.Err()
}

func (r *InquiryRepo) ListForUser(ctx context.Context, userID string) ([]*inquiry.Inquiry, error) {
	const query = `
		SELECT i.id, i.property_id, p.title, i.tenant_id, t.name, i.landlord_id, l.name,
		       COALESCE((SELECT body FROM inquiry_messages m WHERE m.inquiry_id = i.id ORDER BY m.created_at DESC LIMIT 1), ''),
		       i.last_message_at, i.created_at
		FROM   property_inquiries i
		JOIN   properties p ON p.id = i.property_id
		JOIN   users t ON t.id = i.tenant_id
		JOIN   users l ON l.id = i.landlord_id
		WHERE  i.tenant_id = $1 OR i.landlord_id = $1
		ORDER BY i.last_message_at DESC`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*inquiry.Inquiry
	for rows.Next() {
		var in inquiry.Inquiry
		if err := rows.Scan(
			&in.ID, &in.PropertyID, &in.PropertyTitle, &in.TenantID, &in.TenantName,
			&in.LandlordID, &in.LandlordName, &in.LastMessage, &in.LastMessageAt, &in.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, &in)
	}
	return list, rows.Err()
}
