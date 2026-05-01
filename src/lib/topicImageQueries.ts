/**
 * Builds topic-relevant image URLs for the Rank Images dialog.
 *
 * Unsplash's keyless `source.unsplash.com` endpoint was deprecated and now
 * returns no image. We use Loremflickr instead, which is keyless, returns
 * keyword-matched real photos, and supports a `lock` seed so each slot is
 * stable but distinct.
 */

const MODIFIERS_BY_CATEGORY: Record<string, string[]> = {
  Cities: ["skyline", "street", "downtown", "architecture", "park", "night", "landmark", "people", "food", "market", "sunset", "neighborhood"],
  States: ["landscape", "nature", "city", "mountain", "park", "town", "road", "sunset", "river", "skyline", "rural", "scenic"],
  Countries: ["landmark", "culture", "city", "landscape", "people", "food", "architecture", "nature", "street", "flag", "tradition", "scenic"],
  Jobs: ["work", "office", "uniform", "tools", "team", "portrait", "workplace", "hands", "action", "service", "professional", "career"],
  Colleges: ["campus", "students", "library", "classroom", "graduation", "quad", "lecture", "study", "dorm", "sports", "building", "diploma"],
  Schools: ["classroom", "students", "books", "teacher", "playground", "uniform", "blackboard", "study", "kids", "learning", "homework", "graduation"],
  Companies: ["office", "headquarters", "team", "logo", "workplace", "meeting", "products", "innovation", "campus", "employees", "technology", "brand"],
  Health: ["doctor", "patient", "hospital", "wellness", "medicine", "care", "recovery", "treatment", "clinic", "support", "lifestyle", "checkup"],
  Decades: ["fashion", "style", "music", "culture", "vintage", "people", "iconic", "retro", "society", "cars", "scene", "history"],
  Ages: ["lifestyle", "people", "portrait", "moments", "friends", "experience", "everyday", "candid", "growth", "life", "joy", "reflection"],
  Majors: ["study", "students", "books", "lab", "lecture", "research", "campus", "tools", "career", "learning", "project", "graduation"],
  Clubs: ["members", "meeting", "event", "group", "activity", "fun", "team", "gathering", "community", "celebration", "uniform", "social"],
  Fanclubs: ["fans", "concert", "crowd", "merchandise", "stadium", "celebration", "passion", "community", "event", "supporters", "gear", "energy"],
  Teams: ["players", "stadium", "game", "uniform", "trophy", "fans", "action", "celebration", "training", "coach", "field", "victory"],
  Life: ["lifestyle", "people", "moments", "everyday", "candid", "experience", "portrait", "scene", "feeling", "reflection", "joy", "story"],
};

const DEFAULT_MODIFIERS = [
  "portrait", "scene", "lifestyle", "people", "moments", "candid",
  "everyday", "story", "experience", "background", "feeling", "context",
];

/** Stable numeric hash so each (topic, slot) gets a deterministic seed. */
const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

/**
 * Generate ~12 unique image URLs for the topic. Each URL combines the topic
 * name with a different modifier keyword so the gallery looks varied but
 * on-theme, and uses a deterministic `lock` seed so the same slot keeps the
 * same photo across reloads.
 */
export const buildTopicImageUrls = (
  topicName: string,
  categoryName: string,
  count = 12
): string[] => {
  const modifiers = MODIFIERS_BY_CATEGORY[categoryName] ?? DEFAULT_MODIFIERS;
  const cleanTopic = topicName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const topicTag = cleanTopic.replace(/\s+/g, ",");

  return Array.from({ length: count }).map((_, i) => {
    const mod = modifiers[i % modifiers.length];
    const tags = encodeURIComponent(`${topicTag},${mod}`);
    const lock = hashString(`${cleanTopic}-${mod}-${i}`) % 100000;
    return `https://loremflickr.com/600/600/${tags}?lock=${lock}`;
  });
};

/**
 * Build a single, deterministic image URL for an individual post. Seeded by
 * the post id so each post in a topic gets a unique-but-stable on-theme image.
 */
export const buildPostImageUrl = (
  postId: string,
  topicName: string,
  categoryName: string
): string => {
  const modifiers = MODIFIERS_BY_CATEGORY[categoryName] ?? DEFAULT_MODIFIERS;
  const cleanTopic = (topicName || "life").trim().toLowerCase().replace(/[^a-z0-9\s]/g, "") || "life";
  const topicTag = cleanTopic.replace(/\s+/g, ",");

  // Two independent hashes so each post pulls a distinct (primary, secondary)
  // modifier pair — varying the actual tag set, not just the lock seed, which
  // is what makes Loremflickr return visibly different photos.
  const seedA = hashString(`a:${postId}`);
  const seedB = hashString(`b:${postId}:${cleanTopic}`);
  const primary = modifiers[seedA % modifiers.length];
  let secondary = modifiers[seedB % modifiers.length];
  if (secondary === primary) {
    secondary = modifiers[(seedB + 1) % modifiers.length];
  }

  const tags = encodeURIComponent(`${topicTag},${primary},${secondary}`);
  const lock = hashString(`${postId}:${primary}:${secondary}`) % 1_000_000;
  // Tiny dimension jitter forces a fresh image fetch even when tag pools collide.
  const w = 600 + (seedA % 5);
  const h = 600 + (seedB % 5);
  return `https://loremflickr.com/${w}/${h}/${tags}?lock=${lock}`;
};
