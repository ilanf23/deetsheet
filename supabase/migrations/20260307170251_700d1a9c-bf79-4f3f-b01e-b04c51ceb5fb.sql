
-- Temporarily disable FK checks for seeding by inserting profiles directly
-- We'll create fake auth users first, then profiles

-- Create 30 fake users in auth.users for seeding purposes
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES
('b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'sarah_m@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'dad_of_3@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'server_life@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'chi_town@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'dr_hope@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'grad_2024@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'mindful_mom@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'heart_talk@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'med_life@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'retro_fan@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'tip_pro@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'windy_city@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'wise_owl@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'solo_strong@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'survivor_22@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'doc_empathy@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'pixel_kid@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', 'book_parent@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', 'career_first@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'frostbite@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'gym_rat@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'chef_marco@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000000', 'wanderlust@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000000', 'startup_sam@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000000', 'cat_lover@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000000', 'teach_jen@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000000', 'nyc_native@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000000', 'free_lance@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000000', 'quiet_soul@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
('b1000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000000', 'code_ninja@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated');

-- The trigger should auto-create profiles, but let's update them with usernames and bios
UPDATE public.profiles SET username = 'sarah_m', bio = 'Mom of two, coffee enthusiast' WHERE id = 'b1000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET username = 'dad_of_3', bio = 'Raising three wild ones' WHERE id = 'b1000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET username = 'server_life', bio = 'Veteran waiter, 10 years in the game' WHERE id = 'b1000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET username = 'chi_town', bio = 'Born and raised in Chicago' WHERE id = 'b1000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET username = 'dr_hope', bio = 'Oncologist sharing what I know' WHERE id = 'b1000000-0000-0000-0000-000000000005';
UPDATE public.profiles SET username = 'grad_2024', bio = 'Just graduated, full of advice' WHERE id = 'b1000000-0000-0000-0000-000000000006';
UPDATE public.profiles SET username = 'mindful_mom', bio = 'Gentle parenting advocate' WHERE id = 'b1000000-0000-0000-0000-000000000007';
UPDATE public.profiles SET username = 'heart_talk', bio = 'Relationship coach in training' WHERE id = 'b1000000-0000-0000-0000-000000000008';
UPDATE public.profiles SET username = 'med_life', bio = 'Resident physician, sleep deprived' WHERE id = 'b1000000-0000-0000-0000-000000000009';
UPDATE public.profiles SET username = 'retro_fan', bio = '80s kid forever' WHERE id = 'b1000000-0000-0000-0000-000000000010';
UPDATE public.profiles SET username = 'tip_pro', bio = 'Serving tables since 2015' WHERE id = 'b1000000-0000-0000-0000-000000000011';
UPDATE public.profiles SET username = 'windy_city', bio = 'Chicago transplant, 5 years in' WHERE id = 'b1000000-0000-0000-0000-000000000012';
UPDATE public.profiles SET username = 'wise_owl', bio = 'PhD student, night owl' WHERE id = 'b1000000-0000-0000-0000-000000000013';
UPDATE public.profiles SET username = 'solo_strong', bio = 'Learning to love myself first' WHERE id = 'b1000000-0000-0000-0000-000000000014';
UPDATE public.profiles SET username = 'survivor_22', bio = 'Cancer survivor since 2022' WHERE id = 'b1000000-0000-0000-0000-000000000015';
UPDATE public.profiles SET username = 'doc_empathy', bio = 'Family medicine, patient-first' WHERE id = 'b1000000-0000-0000-0000-000000000016';
UPDATE public.profiles SET username = 'pixel_kid', bio = 'Retro gaming collector' WHERE id = 'b1000000-0000-0000-0000-000000000017';
UPDATE public.profiles SET username = 'book_parent', bio = 'Reading to my kids every night' WHERE id = 'b1000000-0000-0000-0000-000000000018';
UPDATE public.profiles SET username = 'career_first', bio = 'Career counselor and mentor' WHERE id = 'b1000000-0000-0000-0000-000000000019';
UPDATE public.profiles SET username = 'frostbite', bio = 'Survived 20 Chicago winters' WHERE id = 'b1000000-0000-0000-0000-000000000020';
UPDATE public.profiles SET username = 'gym_rat', bio = 'Personal trainer, 8 years' WHERE id = 'b1000000-0000-0000-0000-000000000021';
UPDATE public.profiles SET username = 'chef_marco', bio = 'Home cook turned food blogger' WHERE id = 'b1000000-0000-0000-0000-000000000022';
UPDATE public.profiles SET username = 'wanderlust', bio = '40 countries and counting' WHERE id = 'b1000000-0000-0000-0000-000000000023';
UPDATE public.profiles SET username = 'startup_sam', bio = 'Founded 2 startups, failed 1' WHERE id = 'b1000000-0000-0000-0000-000000000024';
UPDATE public.profiles SET username = 'cat_lover', bio = '3 cats, zero regrets' WHERE id = 'b1000000-0000-0000-0000-000000000025';
UPDATE public.profiles SET username = 'teach_jen', bio = 'High school teacher, 12 years' WHERE id = 'b1000000-0000-0000-0000-000000000026';
UPDATE public.profiles SET username = 'nyc_native', bio = 'Manhattan born and raised' WHERE id = 'b1000000-0000-0000-0000-000000000027';
UPDATE public.profiles SET username = 'free_lance', bio = 'Freelance designer and writer' WHERE id = 'b1000000-0000-0000-0000-000000000028';
UPDATE public.profiles SET username = 'quiet_soul', bio = 'Introvert navigating an extrovert world' WHERE id = 'b1000000-0000-0000-0000-000000000029';
UPDATE public.profiles SET username = 'code_ninja', bio = 'Full-stack dev, open source fan' WHERE id = 'b1000000-0000-0000-0000-000000000030';

-- Insert 30 posts across various topics
INSERT INTO public.posts (id, title, content, topic_id, author_id, score, comment_count, created_at) VALUES
('c1000000-0000-0000-0000-000000000001', 'Childproof everything', 'Keep dangerous chemicals out of reach of children at all times', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 45, 3, now() - interval '1 hour'),
('c1000000-0000-0000-0000-000000000002', 'Cut food small', 'Cutting food into small pieces prevents choking in toddlers', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 38, 2, now() - interval '3 hours'),
('c1000000-0000-0000-0000-000000000003', 'Tipping culture', 'Some customers just do not tip no matter how great the service is', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 67, 5, now() - interval '2 hours'),
('c1000000-0000-0000-0000-000000000004', 'Deep dish is king', 'Deep dish pizza is everywhere in Chicago and it never gets old', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 52, 4, now() - interval '4 hours'),
('c1000000-0000-0000-0000-000000000005', 'Screen early', 'Early detection saves lives — get screened regularly', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', 89, 7, now() - interval '5 hours'),
('c1000000-0000-0000-0000-000000000006', 'Use office hours', 'Office hours are the most underused resource in college', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000006', 41, 3, now() - interval '6 hours'),
('c1000000-0000-0000-0000-000000000007', 'Time out rethink', 'Sending kids to their room teaches isolation not reflection', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007', 33, 6, now() - interval '7 hours'),
('c1000000-0000-0000-0000-000000000008', 'Talk it out', 'Communication is everything in a relationship', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000008', 71, 8, now() - interval '8 hours'),
('c1000000-0000-0000-0000-000000000009', 'Burnout is real', 'Burnout is the biggest risk in medicine — protect your energy', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000009', 56, 4, now() - interval '9 hours'),
('c1000000-0000-0000-0000-000000000010', 'MTV era', 'MTV changed the music industry forever in the 80s', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000010', 29, 2, now() - interval '10 hours'),
('c1000000-0000-0000-0000-000000000011', 'Menu mastery', 'Memorize the menu your first week — guests notice', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000011', 44, 3, now() - interval '30 minutes'),
('c1000000-0000-0000-0000-000000000012', 'Ride the L', 'The L train is essential for getting around Chicago', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000012', 37, 2, now() - interval '90 minutes'),
('c1000000-0000-0000-0000-000000000013', 'Sleep over study', 'Sleep matters more than cramming before exams', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000013', 58, 5, now() - interval '150 minutes'),
('c1000000-0000-0000-0000-000000000014', 'Stay yourself', 'Do not lose yourself in a relationship', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000014', 49, 4, now() - interval '210 minutes'),
('c1000000-0000-0000-0000-000000000015', 'Find your group', 'Support groups make a real difference during treatment', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000015', 63, 3, now() - interval '11 hours'),
('c1000000-0000-0000-0000-000000000016', 'Listen first', 'Patient rapport matters as much as diagnosis', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000016', 47, 2, now() - interval '12 hours'),
('c1000000-0000-0000-0000-000000000017', 'Arcade golden age', 'Arcade culture in the 80s was absolutely unmatched', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000017', 25, 1, now() - interval '14 hours'),
('c1000000-0000-0000-0000-000000000018', 'Read every night', 'Read to your kids every single night — it changes everything', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000018', 72, 6, now() - interval '12 minutes'),
('c1000000-0000-0000-0000-000000000019', 'Network early', 'Start networking before senior year — doors close fast', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000019', 39, 3, now() - interval '48 minutes'),
('c1000000-0000-0000-0000-000000000020', 'Layer up', 'Chicago winter is brutal — dress in layers or suffer', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000020', 34, 2, now() - interval '330 minutes'),
('c1000000-0000-0000-0000-000000000021', 'Warm up always', 'Never skip your warm-up — injuries set you back months', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000021', 55, 4, now() - interval '2 hours'),
('c1000000-0000-0000-0000-000000000022', 'Sharp knives', 'A sharp knife is safer than a dull one in the kitchen', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000022', 48, 3, now() - interval '3 hours'),
('c1000000-0000-0000-0000-000000000023', 'Pack light', 'Pack half of what you think you need when traveling', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000023', 61, 5, now() - interval '4 hours'),
('c1000000-0000-0000-0000-000000000024', 'Ship fast', 'Ship your MVP before it feels ready — feedback beats perfection', 'a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000024', 76, 7, now() - interval '5 hours'),
('c1000000-0000-0000-0000-000000000025', 'Vet visits matter', 'Annual vet checkups catch problems early with pets', 'a1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000025', 42, 3, now() - interval '6 hours'),
('c1000000-0000-0000-0000-000000000026', 'Names matter', 'Learn every student name the first week — it builds trust', 'a1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000026', 53, 4, now() - interval '7 hours'),
('c1000000-0000-0000-0000-000000000027', 'Walk everywhere', 'NYC is best explored on foot — skip the subway for short trips', 'a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000027', 46, 3, now() - interval '8 hours'),
('c1000000-0000-0000-0000-000000000028', 'Set boundaries', 'As a freelancer say no to scope creep from day one', 'a1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000028', 59, 5, now() - interval '9 hours'),
('c1000000-0000-0000-0000-000000000029', 'Recharge solo', 'It is okay to cancel plans to recharge — your energy matters', 'a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000029', 64, 6, now() - interval '10 hours'),
('c1000000-0000-0000-0000-000000000030', 'Debug with logs', 'When stuck add console logs everywhere — systematic beats guessing', 'a1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000030', 51, 4, now() - interval '11 hours');

-- Insert 30 comments
INSERT INTO public.comments (id, post_id, author_id, content, created_at) VALUES
('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'So true! Cabinet locks saved us multiple times.', now() - interval '45 minutes'),
('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007', 'Also watch out for small magnets — super dangerous.', now() - interval '30 minutes'),
('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000011', 'After 10 years I have learned to not take it personally.', now() - interval '1 hour'),
('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000012', 'Lou Malnati is the best — fight me.', now() - interval '3 hours'),
('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000015', 'This saved my life. Get your annual checkup.', now() - interval '4 hours'),
('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000013', 'I wish someone told me this freshman year.', now() - interval '5 hours'),
('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000014', 'Took me two failed relationships to learn this.', now() - interval '7 hours'),
('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'Active listening changed my marriage completely.', now() - interval '6 hours'),
('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000016', 'Residency nearly broke me. Take breaks seriously.', now() - interval '8 hours'),
('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000017', 'The first time I saw a music video on TV blew my mind.', now() - interval '9 hours'),
('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000006', 'All-nighters actually made my grades worse.', now() - interval '2 hours'),
('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000001', 'My kids ask for stories every night now. Best habit ever.', now() - interval '10 minutes'),
('d1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000022', 'Tore my hamstring once skipping warmup. Never again.', now() - interval '1 hour'),
('d1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000023', 'Learned this the hard way — dull knife slipped and cut me.', now() - interval '2 hours'),
('d1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000024', 'I always overpack and regret it. Great advice.', now() - interval '3 hours'),
('d1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000025', 'Shipped my app with bugs and still got users. This is the way.', now() - interval '4 hours'),
('d1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000026', 'My vet caught a tumor early on my dog. Checkups matter.', now() - interval '5 hours'),
('d1000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000027', 'Name tents on desks help the first week too.', now() - interval '6 hours'),
('d1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000028', 'Walking across the Brooklyn Bridge is a must.', now() - interval '7 hours'),
('d1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000029', 'Scope creep killed my first freelance project.', now() - interval '8 hours'),
('d1000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000030', 'I stopped apologizing for needing alone time. Game changer.', now() - interval '9 hours'),
('d1000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000021', 'console.log is my best friend during debugging.', now() - interval '10 hours'),
('d1000000-0000-0000-0000-000000000023', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000018', 'Grapes are the sneakiest choking hazard — cut them lengthwise.', now() - interval '2 hours'),
('d1000000-0000-0000-0000-000000000024', 'c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'We switched to calm-down corners and it works so much better.', now() - interval '6 hours'),
('d1000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 'Knowing allergens by heart is even more important.', now() - interval '20 minutes'),
('d1000000-0000-0000-0000-000000000026', 'c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000004', 'Get a Ventra card immediately. Do not pay per ride.', now() - interval '1 hour'),
('d1000000-0000-0000-0000-000000000027', 'c1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000008', 'Your partner should add to your life not complete it.', now() - interval '3 hours'),
('d1000000-0000-0000-0000-000000000028', 'c1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000005', 'Online support groups are great for people in rural areas.', now() - interval '10 hours'),
('d1000000-0000-0000-0000-000000000029', 'c1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000006', 'LinkedIn connections from junior year got me my first job.', now() - interval '40 minutes'),
('d1000000-0000-0000-0000-000000000030', 'c1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000012', 'Thermal underwear is non-negotiable in January.', now() - interval '5 hours');

-- Insert 30 votes
INSERT INTO public.votes (id, post_id, user_id, value, created_at) VALUES
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 1, now() - interval '50 minutes'),
('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007', 1, now() - interval '35 minutes'),
('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000011', 1, now() - interval '1 hour'),
('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', -1, now() - interval '1 hour'),
('e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000015', 1, now() - interval '4 hours'),
('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000009', 1, now() - interval '4 hours'),
('e1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000014', 1, now() - interval '7 hours'),
('e1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 1, now() - interval '6 hours'),
('e1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000016', 1, now() - interval '8 hours'),
('e1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000017', 1, now() - interval '9 hours'),
('e1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000006', 1, now() - interval '2 hours'),
('e1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000001', 1, now() - interval '10 minutes'),
('e1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000022', 1, now() - interval '1 hour'),
('e1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000023', 1, now() - interval '2 hours'),
('e1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000024', 1, now() - interval '3 hours'),
('e1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000025', 1, now() - interval '4 hours'),
('e1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000026', 1, now() - interval '4 hours'),
('e1000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000026', 1, now() - interval '5 hours'),
('e1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000027', 1, now() - interval '6 hours'),
('e1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000028', 1, now() - interval '7 hours'),
('e1000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000029', 1, now() - interval '8 hours'),
('e1000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000030', 1, now() - interval '9 hours'),
('e1000000-0000-0000-0000-000000000023', 'c1000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000021', -1, now() - interval '10 hours'),
('e1000000-0000-0000-0000-000000000024', 'c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000018', 1, now() - interval '2 hours'),
('e1000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000012', 1, now() - interval '3 hours'),
('e1000000-0000-0000-0000-000000000026', 'c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000013', 1, now() - interval '5 hours'),
('e1000000-0000-0000-0000-000000000027', 'c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', -1, now() - interval '6 hours'),
('e1000000-0000-0000-0000-000000000028', 'c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000003', 1, now() - interval '15 minutes'),
('e1000000-0000-0000-0000-000000000029', 'c1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000008', 1, now() - interval '3 hours'),
('e1000000-0000-0000-0000-000000000030', 'c1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000006', 1, now() - interval '40 minutes');
