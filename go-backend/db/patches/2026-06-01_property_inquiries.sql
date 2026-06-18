-- Patch: contact-masked tenant<->landlord inquiry channel.
--
-- Lets a prospective tenant ask a landlord questions about a listing BEFORE committing,
-- entirely in-app (no phone/contact exposed — that is still gated behind a locked squad
-- via BR-06). One thread per (property, tenant); either party can post messages.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS property_inquiries (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID        NOT NULL REFERENCES properties(id),
    tenant_id       UUID        NOT NULL REFERENCES users(id),
    landlord_id     UUID        NOT NULL REFERENCES users(id),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_inquiry_per_tenant_property UNIQUE (property_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS inquiry_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id  UUID        NOT NULL REFERENCES property_inquiries(id),
    sender_id   UUID        NOT NULL REFERENCES users(id),
    body        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_messages_inquiry ON inquiry_messages (inquiry_id, created_at);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_tenant   ON property_inquiries (tenant_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_landlord ON property_inquiries (landlord_id, last_message_at DESC);
