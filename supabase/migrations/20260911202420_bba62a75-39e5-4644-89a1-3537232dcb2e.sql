CREATE OR REPLACE VIEW public.profiles_private AS
SELECT id, username, bio, avatar_url, created_at, name, entity_type, sex,
       birth_month, birth_day, birth_year, city, state, country, city_born,
       education, high_school, college, degree, major, job, favorite_movie,
       reading, email_on_message, email_on_comment, email_on_follow,
       email_on_post_edit, email_top_posts, email_frequency, location_id,
       orientation, hide_age, follower_count, following_count, show_ratings
FROM public.privileged_profiles();

GRANT SELECT ON public.profiles_private TO authenticated;