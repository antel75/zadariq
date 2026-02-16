
-- Ownership claim requests table
CREATE TABLE public.ownership_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int DEFAULT 0,
  status text CHECK (status IN ('pending','verified','expired','locked','superseded')) DEFAULT 'pending',
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_attempt_at timestamptz,
  ip text,
  user_agent text
);

CREATE INDEX ocr_expiry_idx ON public.ownership_claim_requests(expires_at);
CREATE INDEX ocr_user_idx ON public.ownership_claim_requests(requester_user_id);
CREATE INDEX ocr_business_email_idx ON public.ownership_claim_requests(business_id, email, status);

ALTER TABLE public.ownership_claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own claim requests"
ON public.ownership_claim_requests
FOR SELECT TO authenticated
USING (requester_user_id = auth.uid());

CREATE POLICY "Users can insert own claim requests"
ON public.ownership_claim_requests
FOR INSERT TO authenticated
WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY "Service role can update claims"
ON public.ownership_claim_requests
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete claims"
ON public.ownership_claim_requests
FOR DELETE
USING (auth.role() = 'service_role');

-- Audit log table
CREATE TABLE public.ownership_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text,
  action text NOT NULL,
  actor_user_id uuid,
  email text,
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  details jsonb
);

ALTER TABLE public.ownership_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert audit logs"
ON public.ownership_audit_log
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can read audit logs"
ON public.ownership_audit_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Business ownership tracking table
CREATE TABLE public.business_ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text UNIQUE NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_ownership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read business ownership"
ON public.business_ownership
FOR SELECT
USING (true);

CREATE POLICY "Service role can insert ownership"
ON public.business_ownership
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update ownership"
ON public.business_ownership
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Owner can update own business"
ON public.business_ownership
FOR UPDATE TO authenticated
USING (owner_user_id = auth.uid());
