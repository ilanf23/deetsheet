/**
 * Curated pool of realistic Unsplash portrait / pet / character photos used as
 * deterministic fallback avatars for mock usernames. Picked by hashing the
 * username so the same user always gets the same picture across the app.
 */
const AVATAR_POOL: string[] = [
  // People — women
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1546961342-1a46b2b5c2d5?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&h=200&fit=crop&crop=faces&q=80",

  // People — men
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1558898479-33c0057a5d12?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces&q=80",

  // Pets
  "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=200&h=200&fit=crop&q=80", // dog
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&q=80", // cat
  "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=200&h=200&fit=crop&q=80", // dog
  "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200&h=200&fit=crop&q=80", // cat
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop&q=80", // puppy
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop&q=80", // kitten
  "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=200&h=200&fit=crop&q=80", // rabbit
  "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=200&h=200&fit=crop&q=80", // parrot
];

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getMockAvatarUrl = (username: string): string => {
  const idx = hashString(username) % AVATAR_POOL.length;
  return AVATAR_POOL[idx];
};
