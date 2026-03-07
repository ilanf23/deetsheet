export interface Post {
  id: string;
  topicName: string;
  categoryName: string;
  content: string;
  username: string;
  ratingScore: number;
  ratingCount: number;
  commentCount: number;
  createdAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  categoryName: string;
  postCount: number;
  topPosts: string[];
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

export const categories = [
  { id: "1", name: "Life" },
  { id: "2", name: "Jobs" },
  { id: "3", name: "Cities" },
  { id: "4", name: "Health" },
  { id: "5", name: "Decades" },
];

export const topics: Topic[] = [
  { id: "1", name: "Parent", categoryName: "Life", postCount: 142, topPosts: ["Keep dangerous chemicals out of reach", "Cutting food into small pieces", "Sending kids to their room teaches isolation, not reflection"] },
  { id: "2", name: "Waiter", categoryName: "Jobs", postCount: 98, topPosts: ["Some customers don't tip", "Memorize the menu your first week", "Always check on tables within 2 minutes"] },
  { id: "3", name: "Chicago", categoryName: "Cities", postCount: 215, topPosts: ["Deep dish pizza is everywhere", "The L train is essential", "Winter is brutal — dress in layers"] },
  { id: "4", name: "Cancer", categoryName: "Health", postCount: 76, topPosts: ["Early detection saves lives", "Support groups make a real difference", "Ask your doctor about clinical trials"] },
  { id: "5", name: "College", categoryName: "Life", postCount: 310, topPosts: ["Office hours are underused", "Start networking before senior year", "Sleep matters more than cramming"] },
  { id: "6", name: "Love", categoryName: "Life", postCount: 189, topPosts: ["Communication is everything", "Love languages are real", "Don't lose yourself in a relationship"] },
  { id: "7", name: "Doctor", categoryName: "Jobs", postCount: 64, topPosts: ["Burnout is the biggest risk", "Patient rapport matters as much as diagnosis", "Residency changes you"] },
  { id: "8", name: "1980s", categoryName: "Decades", postCount: 52, topPosts: ["MTV changed everything", "Arcade culture was unmatched", "Reagan era shaped modern politics"] },
];

export const posts: Post[] = [
  { id: "1", topicName: "Parent", categoryName: "Life", content: "Keep dangerous chemicals out of reach", username: "sarah_m", ratingScore: 891, ratingCount: 100, commentCount: 45, createdAt: hoursAgo(1) },
  { id: "2", topicName: "Parent", categoryName: "Life", content: "Cutting food into small pieces prevents choking", username: "dad_of_3", ratingScore: 856, ratingCount: 98, commentCount: 32, createdAt: hoursAgo(3) },
  { id: "3", topicName: "Waiter", categoryName: "Jobs", content: "Some customers don't tip", username: "server_life", ratingScore: 890, ratingCount: 100, commentCount: 67, createdAt: hoursAgo(2) },
  { id: "4", topicName: "Chicago", categoryName: "Cities", content: "Deep dish pizza is everywhere", username: "chi_town", ratingScore: 780, ratingCount: 90, commentCount: 23, createdAt: hoursAgo(4) },
  { id: "5", topicName: "Cancer", categoryName: "Health", content: "Early detection saves lives", username: "dr_hope", ratingScore: 940, ratingCount: 100, commentCount: 89, createdAt: hoursAgo(5) },
  { id: "6", topicName: "College", categoryName: "Life", content: "Office hours are the most underused resource", username: "grad_2024", ratingScore: 820, ratingCount: 95, commentCount: 41, createdAt: hoursAgo(6) },
  { id: "7", topicName: "Parent", categoryName: "Life", content: "Sending kids to their room teaches isolation, not reflection", username: "mindful_mom", ratingScore: 760, ratingCount: 88, commentCount: 56, createdAt: hoursAgo(7) },
  { id: "8", topicName: "Love", categoryName: "Life", content: "Communication is everything in a relationship", username: "heart_talk", ratingScore: 910, ratingCount: 100, commentCount: 73, createdAt: hoursAgo(8) },
  { id: "9", topicName: "Doctor", categoryName: "Jobs", content: "Burnout is the biggest risk in medicine", username: "med_life", ratingScore: 870, ratingCount: 96, commentCount: 34, createdAt: hoursAgo(9) },
  { id: "10", topicName: "1980s", categoryName: "Decades", content: "MTV changed the music industry forever", username: "retro_fan", ratingScore: 750, ratingCount: 85, commentCount: 28, createdAt: hoursAgo(10) },
  { id: "11", topicName: "Waiter", categoryName: "Jobs", content: "Memorize the menu your first week", username: "tip_pro", ratingScore: 810, ratingCount: 92, commentCount: 19, createdAt: hoursAgo(0.5) },
  { id: "12", topicName: "Chicago", categoryName: "Cities", content: "The L train is essential for getting around", username: "windy_city", ratingScore: 730, ratingCount: 84, commentCount: 15, createdAt: hoursAgo(1.5) },
  { id: "13", topicName: "College", categoryName: "Life", content: "Sleep matters more than cramming", username: "wise_owl", ratingScore: 880, ratingCount: 97, commentCount: 52, createdAt: hoursAgo(2.5) },
  { id: "14", topicName: "Love", categoryName: "Life", content: "Don't lose yourself in a relationship", username: "solo_strong", ratingScore: 840, ratingCount: 93, commentCount: 61, createdAt: hoursAgo(3.5) },
  { id: "15", topicName: "Cancer", categoryName: "Health", content: "Support groups make a real difference", username: "survivor_22", ratingScore: 900, ratingCount: 99, commentCount: 44, createdAt: hoursAgo(11) },
  { id: "16", topicName: "Doctor", categoryName: "Jobs", content: "Patient rapport matters as much as diagnosis", username: "doc_empathy", ratingScore: 860, ratingCount: 94, commentCount: 37, createdAt: hoursAgo(12) },
  { id: "17", topicName: "1980s", categoryName: "Decades", content: "Arcade culture was unmatched", username: "pixel_kid", ratingScore: 720, ratingCount: 82, commentCount: 21, createdAt: hoursAgo(14) },
  { id: "18", topicName: "Parent", categoryName: "Life", content: "Read to your kids every single night", username: "book_parent", ratingScore: 920, ratingCount: 100, commentCount: 38, createdAt: hoursAgo(0.2) },
  { id: "19", topicName: "College", categoryName: "Life", content: "Start networking before senior year", username: "career_first", ratingScore: 790, ratingCount: 89, commentCount: 27, createdAt: hoursAgo(0.8) },
  { id: "20", topicName: "Chicago", categoryName: "Cities", content: "Winter is brutal — dress in layers", username: "frostbite", ratingScore: 770, ratingCount: 87, commentCount: 33, createdAt: hoursAgo(5.5) },
];

export const getAverageRating = (post: Post): number => {
  if (post.ratingCount === 0) return 0;
  return Math.round((post.ratingScore / post.ratingCount) * 10) / 10;
};

export const getRecentPosts = () =>
  [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export const getPopularPosts = () =>
  [...posts].sort((a, b) => {
    const avgA = getAverageRating(a);
    const avgB = getAverageRating(b);
    if (avgB !== avgA) return avgB - avgA;
    return b.ratingCount - a.ratingCount;
  });

export const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
