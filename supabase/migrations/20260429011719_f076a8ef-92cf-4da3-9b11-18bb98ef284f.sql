
CREATE OR REPLACE FUNCTION public._gen_comment(topic_name text, is_top_level boolean, r_tier float8, r_variant float8)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  micro text[] := ARRAY[
    'Agreed.','This.','Hard agree.','Hard disagree.','Saving this.','Cosign.','Underrated take.','lol same.',
    'Same here.','Nope.','Yep.','100%.','Facts.','Big if true.','Bookmarked.','Came here to say this.',
    'Spot on.','Nailed it.','Not buying it.','Unpopular but true.','Wish I had read this sooner.',
    'Needed to hear this today.','Way oversimplified.','Counterpoint coming below.','My experience exactly.',
    'Brutal but fair.','This aged well.','Mostly right.','Half right, half off.','No notes.'
  ];
  short_t text[] := ARRAY[
    'Came here to say this. The {topic} crowd needed to hear it.',
    'Honestly? Not sure I buy this for {topic}, but I see the point.',
    'Been doing {topic} for years and this is the first take that actually matches reality.',
    'Half right. The other half depends a lot on where you are starting from.',
    'Anyone else tried this with {topic}? Curious how it landed.',
    'Solid framing. The execution is harder than it sounds though.',
    'I keep seeing this advice for {topic} and I keep ignoring it. Probably my mistake.',
    'Wait, are we talking generally or specifically about beginners?',
    'This used to be true. Not sure it still is.',
    'Strong take. I would soften it about 30% but the core stands.',
    'The part about consistency over intensity, yes. Everything else, debatable.',
    'You buried the lede. Last sentence is the whole post.',
    'Genuinely curious where the data on this comes from.',
    'I want to agree but my own experience with {topic} says otherwise.',
    'Helpful, but feels like it is missing the social side of things.',
    'OP, do you have a source or is this from personal experience?',
    'Reading this on my phone in bed and feeling personally attacked.',
    'This is the kind of post that makes the site worth visiting.',
    'Two years into {topic} and this would have saved me about a year.',
    'Mostly agree. The one bit I would push back on is the timing.',
    'Posts like this are why I keep checking back here.',
    'Not sure if this generalizes outside the US, but locally, accurate.'
  ];
  medium_t text[] := ARRAY[
    'I came to {topic} late and the thing nobody tells you is how much of it is unlearning, not learning. The first six months I made the most progress not by adding new habits but by dropping three or four bad ones. Wish someone had said that out loud.',
    'Disagree on one point. The "just start" advice is great for motivation but terrible for retention. People burn out in two weeks because they did not plan for the boring middle. For {topic} specifically, the middle is where everything actually happens.',
    'This matches what I have seen, with one caveat: it really depends on whether you have a partner or family pulling on the same rope. Solo, this works. With a household pulling in five directions it falls apart by week three.',
    'Good thread. The thing I would add is that {topic} rewards patience way more than it rewards intelligence. The smartest people I know in this space are also the most willing to look stupid for a year while they get their footing.',
    'I have been doing this for almost a decade and the single biggest unlock was realizing I did not need a system, I needed to stop quitting systems after two weeks. Whatever you pick, run it longer than feels reasonable before deciding it does not work.',
    'Honestly this reads like advice that sounds great until you try it on a Tuesday at 9pm with two kids and a deadline. The principles are right. The implementation is where everyone, including me, falls apart.',
    'I would push back gently. The framing assumes you are starting from zero. Most people in {topic} are starting from "I tried this twice already and it did not stick," which is a totally different problem and needs a different answer.',
    'Came in skeptical, leaving convinced. The bit about tracking the wrong metric for the first year is exactly what happened to me. Took a friend pointing it out before I noticed. Saving this whole thread.',
    'Three things I would add to this for {topic}: pick the boring option, do it longer than you want to, and stop researching the next thing until the current thing has actually run its course. That is basically the whole game for me.',
    'This is solid but I think it underrates how much of long-term success in {topic} is just having one person in your life who notices when you fall off. Pure willpower stops working after about eight months. Accountability does not.'
  ];
  long_t text[] := ARRAY[
    'I have been around {topic} long enough to have changed my mind on this exact question twice. First I thought the answer was discipline. Then I thought it was systems. Now I think it is mostly environment, with a side of low-stakes daily exposure. The discipline and systems both fall out of that almost for free, but if your environment is fighting you, neither works for long. The thing I wish someone had told me at the start: do not optimize the activity, optimize the friction around the activity. Make starting easier than not starting and most of the rest takes care of itself.',
    'Really good post and I want to add the one piece I almost never see in these threads. Almost everyone who succeeds at {topic} long-term has at least one person in their life who they do not want to disappoint. Spouse, friend, coach, online group, doesnt matter. The accountability is not a nice-to-have, it is load-bearing. Pure self-discipline works for a few months, maybe a year if you are unusually wired for it. After that, life happens and the thing quietly dies unless someone else notices when you skip.',
    'Some of this lines up with my experience and some does not. The "start small" advice is gospel and I will not fight it. But the implication that progress is mostly linear if you just stick with it, that has not matched what I have seen at all. With {topic}, progress comes in jumps separated by long flat stretches that feel like nothing is happening. Most people quit during the flat stretches because they assume they are doing it wrong. They are not. The flat stretch is the work. The jump is just the visible part.'
  ];
  xlong_t text[] := ARRAY[
    'Long reply incoming, sorry in advance. I have been thinking about this for a while because I went through the exact arc the post describes with {topic}, including the part where you think you have figured it out and then six months later realize you had not. Two things stand out in hindsight. First, almost every "rule" in this space is actually a default, not a law. The defaults are good defaults, but the people who get the most out of {topic} are usually the ones who learn the defaults well enough to know when to break them. Second, and this is the harder one, almost nobody talks honestly about how much of long-term success here is just being lucky enough to have the time, the money, and the people around you to keep going during the bad stretches. That does not mean the advice is wrong. It means the advice should come with an asterisk that says "and also, your circumstances matter a lot, and that is not a personal failing."'
  ];
  tier text;
  out_text text;
BEGIN
  IF is_top_level THEN
    tier := CASE
      WHEN r_tier < 0.25 THEN 'micro'
      WHEN r_tier < 0.55 THEN 'short'
      WHEN r_tier < 0.80 THEN 'medium'
      WHEN r_tier < 0.95 THEN 'long'
      ELSE 'xlong'
    END;
  ELSE
    tier := CASE
      WHEN r_tier < 0.45 THEN 'micro'
      WHEN r_tier < 0.78 THEN 'short'
      WHEN r_tier < 0.93 THEN 'medium'
      WHEN r_tier < 0.99 THEN 'long'
      ELSE 'xlong'
    END;
  END IF;

  out_text := CASE tier
    WHEN 'micro'  THEN micro[1   + floor(r_variant * array_length(micro,   1))::int]
    WHEN 'short'  THEN short_t[1 + floor(r_variant * array_length(short_t, 1))::int]
    WHEN 'medium' THEN medium_t[1+ floor(r_variant * array_length(medium_t,1))::int]
    WHEN 'long'   THEN long_t[1  + floor(r_variant * array_length(long_t,  1))::int]
    ELSE              xlong_t[1  + floor(r_variant * array_length(xlong_t, 1))::int]
  END;

  RETURN replace(coalesce(out_text, 'Good point.'), '{topic}', coalesce(topic_name, 'this'));
END;
$fn$;
