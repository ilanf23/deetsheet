-- Grant admin privileges to ilan@maverich.ai
UPDATE public.profiles SET is_admin = true WHERE email = 'ilan@maverich.ai';
