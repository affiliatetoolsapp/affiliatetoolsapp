-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  instance_id
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@affiliatetools.app',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  'authenticated',
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  true,
  '00000000-0000-0000-0000-000000000000'
);

-- Create admin user profile in public.users
INSERT INTO public.users (
  id,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@affiliatetools.app',
  'admin',
  now(),
  now()
); 