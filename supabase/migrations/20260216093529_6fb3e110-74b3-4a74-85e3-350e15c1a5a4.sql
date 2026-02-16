
-- Table for pending corrections
CREATE TABLE public.pending_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  field_name text NOT NULL,
  old_value text,
  proposed_value text,
  fingerprint_hash text NOT NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  confidence_score integer NOT NULL DEFAULT 50,
  reviewed_at timestamptz,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

-- Public can insert via edge function (service role)
CREATE POLICY "Service role can manage pending_changes"
  ON public.pending_changes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can read and update
CREATE POLICY "Admins can read pending_changes"
  ON public.pending_changes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pending_changes"
  ON public.pending_changes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Index for rate limiting queries
CREATE INDEX idx_pending_changes_fingerprint ON public.pending_changes (fingerprint_hash, created_at);
CREATE INDEX idx_pending_changes_status ON public.pending_changes (status);
CREATE INDEX idx_pending_changes_entity ON public.pending_changes (entity_type, entity_id, field_name);
