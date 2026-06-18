-- Patch: add users.whatsapp_encrypted for the landlord contact feature.
--
-- Landlords provide a phone (phone_encrypted, already present) and an optional
-- WhatsApp number; both are AES-256 encrypted. Revealed to a squad only after it
-- locks a property (BR-06) and used by the tenant<->landlord inquiry channel.
-- Safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_encrypted TEXT;
