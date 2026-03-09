

## Plan: Seed Comments on All 3,000 Subtopic Posts

### Current State
- 3,000 posts across 30 topics (100 per topic)
- 0 comments in the database
- 30 mock user profiles available

### What Will Be Built

Update the existing `seed-posts` edge function to add **3-5 comments per post** (roughly 10,000-15,000 comments total). Each comment will be:

- **Longer than typical comments** — 100-250 words of substantive discussion, personal anecdotes, or detailed responses to the subtopic
- Topic-aware content (e.g., parenting comments on Parent posts, fitness comments on Gym posts)
- Assigned to different mock users than the post author (round-robin through the 30 profiles)
- Varied timestamps (spread across the last few weeks)

### Technical Approach

1. **Update `supabase/functions/seed-posts/index.ts`** to add a comment-seeding phase after posts are inserted
2. For each post, generate 3-5 comments using topic-specific comment templates (20+ templates per topic category)
3. Batch insert comments (50 at a time) to stay within limits
4. Update `comment_count` on each post to reflect actual comment count

### Execution
- Deploy the updated edge function
- Invoke it to populate comments

