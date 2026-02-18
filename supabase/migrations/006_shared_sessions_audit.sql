-- Add layout audit columns to shared_sessions table
ALTER TABLE shared_sessions
ADD COLUMN IF NOT EXISTS layout_audit_responses JSONB,
ADD COLUMN IF NOT EXISTS layout_audit_variables JSONB;
