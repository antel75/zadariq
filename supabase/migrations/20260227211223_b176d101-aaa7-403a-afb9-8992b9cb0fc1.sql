
-- Quests table
CREATE TABLE public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL,
  description jsonb,
  duration_minutes integer,
  total_points integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'always',
  time_start time without time zone,
  time_end time without time zone,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active quests" ON public.quests FOR SELECT USING (true);
CREATE POLICY "Admins can manage quests" ON public.quests FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON public.quests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quest checkpoints table
CREATE TABLE public.quest_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  order_num integer NOT NULL DEFAULT 0,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius_outer integer NOT NULL DEFAULT 100,
  radius_inner integer NOT NULL DEFAULT 20,
  story jsonb,
  local_tip jsonb,
  challenge_type text NOT NULL DEFAULT 'button_confirm',
  challenge_question jsonb,
  challenge_options jsonb,
  challenge_correct text,
  points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quest_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read quest checkpoints" ON public.quest_checkpoints FOR SELECT USING (true);
CREATE POLICY "Admins can manage quest checkpoints" ON public.quest_checkpoints FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quest_checkpoints_updated_at BEFORE UPDATE ON public.quest_checkpoints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quest progress table
CREATE TABLE public.quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  total_points integer NOT NULL DEFAULT 0,
  checkpoints_completed jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quest progress" ON public.quest_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own quest progress" ON public.quest_progress FOR SELECT USING (true);
CREATE POLICY "Users can update own quest progress" ON public.quest_progress FOR UPDATE USING (session_id = session_id) WITH CHECK (true);
