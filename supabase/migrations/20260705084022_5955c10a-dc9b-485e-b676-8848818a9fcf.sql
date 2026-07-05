
-- ============================================================
-- SECTION 1: Move has_role to private schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- Recreate every policy that references public.has_role using private.has_role
DROP POLICY IF EXISTS "Admins can read roles" ON public.user_roles;
CREATE POLICY "Admins can read roles" ON public.user_roles
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'::app_role) OR (user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage business hours overrides" ON public.business_hours_overrides;
CREATE POLICY "Admins can manage business hours overrides" ON public.business_hours_overrides
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage cinema movies" ON public.cinema_movies;
CREATE POLICY "Admins can manage cinema movies" ON public.cinema_movies
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage cinema screenings" ON public.cinema_screenings;
CREATE POLICY "Admins can manage cinema screenings" ON public.cinema_screenings
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage city alerts" ON public.city_alerts;
CREATE POLICY "Admins can manage city alerts" ON public.city_alerts
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage city_contacts" ON public.city_contacts;
CREATE POLICY "Admins can manage city_contacts" ON public.city_contacts
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage city events" ON public.city_events;
CREATE POLICY "Admins can manage city events" ON public.city_events
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage duty services" ON public.duty_services;
CREATE POLICY "Admins can manage duty services" ON public.duty_services
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage ev chargers" ON public.ev_chargers;
CREATE POLICY "Admins can manage ev chargers" ON public.ev_chargers
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage health places" ON public.health_places;
CREATE POLICY "Admins can manage health places" ON public.health_places
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can read enabled health places" ON public.health_places;
CREATE POLICY "Public can read enabled health places" ON public.health_places
  FOR SELECT USING ((enabled = true) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage open_now_places" ON public.open_now_places;
CREATE POLICY "Admins can manage open_now_places" ON public.open_now_places
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.ownership_audit_log;
CREATE POLICY "Admins can read audit logs" ON public.ownership_audit_log
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can read pending_changes" ON public.pending_changes;
CREATE POLICY "Admins can read pending_changes" ON public.pending_changes
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update pending_changes" ON public.pending_changes;
CREATE POLICY "Admins can update pending_changes" ON public.pending_changes
  FOR UPDATE USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage pending_places" ON public.pending_places;
CREATE POLICY "Admins can manage pending_places" ON public.pending_places
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can read approved pending places" ON public.pending_places;
CREATE POLICY "Public can read approved pending places" ON public.pending_places
  FOR SELECT USING ((status = 'approved'::text) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage holidays" ON public.public_holidays;
CREATE POLICY "Admins manage holidays" ON public.public_holidays
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage quest checkpoints" ON public.quest_checkpoints;
CREATE POLICY "Admins can manage quest checkpoints" ON public.quest_checkpoints
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage quests" ON public.quests;
CREATE POLICY "Admins can manage quests" ON public.quests
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage shop sunday schedule" ON public.shop_sunday_schedule;
CREATE POLICY "Admins can manage shop sunday schedule" ON public.shop_sunday_schedule
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete sports events" ON public.sports_events;
CREATE POLICY "Admins can delete sports events" ON public.sports_events
  FOR DELETE USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert sports events" ON public.sports_events;
CREATE POLICY "Admins can insert sports events" ON public.sports_events
  FOR INSERT WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update sports events" ON public.sports_events;
CREATE POLICY "Admins can update sports events" ON public.sports_events
  FOR UPDATE USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage submissions" ON public.sports_manual_submissions;
CREATE POLICY "Admins can manage submissions" ON public.sports_manual_submissions
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can read approved submissions" ON public.sports_manual_submissions;
CREATE POLICY "Anyone can read approved submissions" ON public.sports_manual_submissions
  FOR SELECT USING ((status = 'approved'::text) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage transport schedules" ON public.transport_schedules;
CREATE POLICY "Admins can manage transport schedules" ON public.transport_schedules
  FOR ALL USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Drop legacy public.has_role now that no policies reference it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- ============================================================
-- SECTION 2: increment_poll_vote - restrict to service_role
-- ============================================================
ALTER FUNCTION public.increment_poll_vote(uuid) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.increment_poll_vote(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_poll_vote(uuid) TO service_role;

-- ============================================================
-- SECTION 3: business_ownership - remove public sensitive read
-- ============================================================
DROP POLICY IF EXISTS "Public can read business ownership" ON public.business_ownership;
-- Owners still see their own ("Vlasnik vidi svoje biznise"), admins see all via manage policy
CREATE POLICY "Admins can read all business ownership" ON public.business_ownership
  FOR SELECT USING (private.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- SECTION 4: quest_progress - fix tautology policies
-- ============================================================
DROP POLICY IF EXISTS "Users can update own quest progress" ON public.quest_progress;
DROP POLICY IF EXISTS "Users can read own quest progress" ON public.quest_progress;

CREATE POLICY "Admins can read quest progress" ON public.quest_progress
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- No direct public UPDATE; force route through RPC below
CREATE POLICY "Deny direct UPDATE on quest progress" ON public.quest_progress
  FOR UPDATE USING (false) WITH CHECK (false);

-- Private definer function does the session-scoped update
CREATE OR REPLACE FUNCTION private.update_quest_progress(
  p_id uuid, p_session_id text,
  p_total_points integer DEFAULT NULL,
  p_checkpoints_completed jsonb DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_completed_at timestamptz DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 8 THEN
    RAISE EXCEPTION 'invalid_session';
  END IF;
  UPDATE public.quest_progress
    SET total_points = COALESCE(p_total_points, total_points),
        checkpoints_completed = COALESCE(p_checkpoints_completed, checkpoints_completed),
        status = COALESCE(p_status, status),
        completed_at = COALESCE(p_completed_at, completed_at)
  WHERE id = p_id AND session_id = p_session_id;
END;
$$;
REVOKE ALL ON FUNCTION private.update_quest_progress(uuid, text, integer, jsonb, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.update_quest_progress(uuid, text, integer, jsonb, text, timestamptz) TO anon, authenticated;

-- Public wrapper (INVOKER) so the client can call via .rpc()
CREATE OR REPLACE FUNCTION public.update_quest_progress(
  p_id uuid, p_session_id text,
  p_total_points integer DEFAULT NULL,
  p_checkpoints_completed jsonb DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_completed_at timestamptz DEFAULT NULL
) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.update_quest_progress(p_id, p_session_id, p_total_points, p_checkpoints_completed, p_status, p_completed_at)
$$;
REVOKE ALL ON FUNCTION public.update_quest_progress(uuid, text, integer, jsonb, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_quest_progress(uuid, text, integer, jsonb, text, timestamptz) TO anon, authenticated;

-- ============================================================
-- SECTION 5: cafe_smoking_reports - hide fingerprint_hash / ip_hash
-- ============================================================
-- Move cooldown lookup behind a security definer function
CREATE OR REPLACE FUNCTION private.check_cafe_smoking_cooldown(
  p_business_id text, p_fingerprint text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_business int;
  recent_total int;
BEGIN
  SELECT COUNT(*) INTO recent_business FROM public.cafe_smoking_reports
    WHERE business_id = p_business_id
      AND fingerprint_hash = p_fingerprint
      AND created_at >= now() - interval '30 days';
  SELECT COUNT(*) INTO recent_total FROM public.cafe_smoking_reports
    WHERE fingerprint_hash = p_fingerprint
      AND created_at >= now() - interval '10 minutes';
  RETURN jsonb_build_object(
    'business_cooldown', recent_business > 0,
    'rate_limited', recent_total >= 5
  );
END;
$$;
REVOKE ALL ON FUNCTION private.check_cafe_smoking_cooldown(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.check_cafe_smoking_cooldown(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_cafe_smoking_cooldown(p_business_id text, p_fingerprint text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.check_cafe_smoking_cooldown(p_business_id, p_fingerprint)
$$;
REVOKE ALL ON FUNCTION public.check_cafe_smoking_cooldown(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_cafe_smoking_cooldown(text, text) TO anon, authenticated;

-- Column-level: revoke everything, grant only non-sensitive columns to public
REVOKE SELECT ON public.cafe_smoking_reports FROM anon, authenticated;
GRANT SELECT (id, business_id, report_value, created_at) ON public.cafe_smoking_reports TO anon, authenticated;
GRANT SELECT ON public.cafe_smoking_reports TO service_role;

-- ============================================================
-- SECTION 6: pending_places - hide submitter_email / hashes
-- ============================================================
REVOKE SELECT ON public.pending_places FROM anon, authenticated;
GRANT SELECT (id, proposed_name, proposed_address, lat, lng, phone, website, category,
              proposed_smoking_status, created_at, status, notes, reviewed_at, reviewed_by)
  ON public.pending_places TO anon, authenticated;
GRANT SELECT ON public.pending_places TO service_role;
