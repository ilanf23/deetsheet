REVOKE ALL ON FUNCTION public.recalculate_profile_follow_counts(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_user_follow_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_topic_follow_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_post_follow_counts() FROM PUBLIC, anon, authenticated;