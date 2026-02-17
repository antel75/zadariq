
-- Admin can insert sports events
CREATE POLICY "Admins can insert sports events"
ON public.sports_events
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can update sports events
CREATE POLICY "Admins can update sports events"
ON public.sports_events
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can delete sports events
CREATE POLICY "Admins can delete sports events"
ON public.sports_events
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
