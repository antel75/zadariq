
-- Duty service types
CREATE TYPE public.duty_service_type AS ENUM ('pharmacy', 'dentist', 'doctor', 'night_service');

-- Source of information
CREATE TYPE public.info_source AS ENUM ('phone', 'website', 'official', 'owner_confirmed');

-- Duty services table
CREATE TABLE public.duty_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type duty_service_type NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL DEFAULT CURRENT_DATE,
  source info_source NOT NULL DEFAULT 'official',
  notes TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transport schedule types
CREATE TYPE public.transport_type AS ENUM ('ferry', 'catamaran', 'city_bus', 'intercity_bus');

-- Transport schedules table
CREATE TABLE public.transport_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type transport_type NOT NULL,
  line_name TEXT NOT NULL,
  route TEXT,
  departure_time TIME NOT NULL,
  port_or_station TEXT,
  destination TEXT,
  carrier TEXT,
  platform TEXT,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL DEFAULT '2099-12-31',
  source info_source NOT NULL DEFAULT 'official',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.duty_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_schedules ENABLE ROW LEVEL SECURITY;

-- Public read for valid, enabled entries
CREATE POLICY "Public can read active duty services"
  ON public.duty_services FOR SELECT
  USING (enabled = true AND CURRENT_DATE BETWEEN valid_from AND valid_until);

CREATE POLICY "Public can read active transport schedules"
  ON public.transport_schedules FOR SELECT
  USING (enabled = true AND CURRENT_DATE BETWEEN valid_from AND valid_until);

-- Admin role system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin can do everything on duty_services
CREATE POLICY "Admins can manage duty services"
  ON public.duty_services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can do everything on transport_schedules
CREATE POLICY "Admins can manage transport schedules"
  ON public.transport_schedules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can read roles
CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_duty_services_updated_at
  BEFORE UPDATE ON public.duty_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_schedules_updated_at
  BEFORE UPDATE ON public.transport_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
