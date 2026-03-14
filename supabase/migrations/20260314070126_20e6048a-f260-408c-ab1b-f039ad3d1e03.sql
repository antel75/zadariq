
CREATE POLICY "Users can insert own profile"
  ON public.owner_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
