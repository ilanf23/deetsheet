/**
 * Builds topic-relevant image search queries for the Rank Images dialog.
 *
 * We use Unsplash's keyless "source" endpoint, which returns a real photo
 * matching the comma-separated keywords. By varying the modifier per slot
 * we get ~12 different but on-topic candidates per topic.
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

/**
 * Generate ~12 unique image URLs for the topic, each phrased as a different
 * angle on the same subject so the gallery looks varied but on-theme.
 */
export const buildTopicImageUrls = (
  topicName: string,
  categoryName: string,
  count = 12
): string[] => {
  const modifiers = MODIFIERS_BY_CATEGORY[categoryName] ?? DEFAULT_MODIFIERS;
  const subject = encodeURIComponent(topicName.trim());

  return Array.from({ length: count }).map((_, i) => {
    const mod = encodeURIComponent(modifiers[i % modifiers.length]);
    // `sig` keeps Unsplash from returning the same photo across slots.
    const sig = `${topicName}-${i}`.replace(/\s+/g, "-").toLowerCase();
    return `https://source.unsplash.com/featured/600x600/?${subject},${mod}&sig=${encodeURIComponent(sig)}`;
  });
};
