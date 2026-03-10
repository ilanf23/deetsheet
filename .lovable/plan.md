

# Plan: Populate Fake Profiles with Realistic Data

## What We're Doing
Update all 31 seed user profiles in the database with rich, realistic personal information — names, locations, jobs, education, bios, and demographics — so each user feels like a real person connected to the topics and posts they contribute to.

## Approach
Use the database insert tool to run UPDATE statements on the `profiles` table, filling in: `name`, `sex`, `city`, `state`, `country`, `job`, `education`, `college`, `major`, `degree`, `high_school`, `city_born`, `birth_month`, `birth_day`, `birth_year`, `favorite_movie`, `reading`, and richer `bio` text.

Each profile will be crafted to match the user's posting history. For example:
- **sarah_m** (posts about parenting) → Sarah Mitchell, 34, mom in Austin TX, elementary school teacher
- **dr_hope** (posts about cancer) → Dr. Amara Hope, oncologist in Boston, Harvard Med
- **server_life** (posts about waiting tables) → Marcus Torres, waiter in Portland
- **chi_town** (posts about Chicago) → lives in Chicago, born there
- **wanderlust** (posts about travel in 20s) → young traveler, remote worker

## Technical Details
- ~31 UPDATE statements via the data insert tool (not migrations, since this is data not schema)
- No code changes needed — the Profile page already reads and displays these fields
- Will ensure diversity in gender, location, age, and background across the user base

