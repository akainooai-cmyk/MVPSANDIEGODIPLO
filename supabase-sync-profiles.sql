-- =============================================
-- SYNCHRONISER LES PROFILS MANQUANTS
-- =============================================
-- Ce script crée les profils manquants pour les utilisateurs
-- qui existaient avant la création du trigger

INSERT INTO public.profiles (id, email, full_name)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
