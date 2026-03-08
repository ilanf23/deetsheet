

## Plan: Populate Each Topic with 100 Ranked Posts

### Current State
- 30 topics exist in the database
- 30 mock users (auth + profiles) exist
- Only 30 posts total across all topics

### What Needs to Happen

**Delete existing posts, comments, and votes**, then insert fresh data:

1. **Clear existing data** -- delete votes, comments, posts (in order to respect foreign keys)

2. **Insert 100 posts per topic** (30 topics x 100 = 3,000 posts total)
   - Each post is a user-contributed "deet" (piece of advice) ranked 1-100 within its topic
   - Each post has a meaningful title and a **long, detailed content body** (2-4 paragraphs of real advice)
   - Posts are assigned to the 30 mock users in a round-robin fashion
   - Score decreases as rank increases (rank 1 has highest score)
   - `comment_count` set to 0 initially

3. **Execution approach**: Because this is 3,000 rows with long content, I will use an **edge function** to generate and insert the data. This avoids SQL migration size limits. The function will:
   - Loop through all 30 topics
   - For each topic, insert 100 posts with contextually appropriate advice content
   - Use the service role key to bypass RLS

### Topics and Content Themes
Each topic gets 100 posts with advice relevant to that topic (e.g., "Parent" gets parenting advice, "Gym" gets fitness tips, "Chicago" gets city living tips, etc.). Content will be pre-written template strings with variety.

### Technical Details
- Use the database insert tool to run batched INSERT statements
- Posts will have scores from 100 (rank 1) down to 1 (rank 100)
- Author IDs cycle through the 30 mock users
- Each post content will be 150-300 words of detailed advice

### Scope
- ~3,000 posts with long-form content
- Will be done in batches (e.g., 5 topics at a time) via the insert tool to stay within limits

