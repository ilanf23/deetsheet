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
  imageUrl?: string;
}

export interface Topic {
  id: string;
  name: string;
  categoryName: string;
  postCount: number;
  topPosts: string[];
  imageUrl?: string;
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

export const categories = [
  { id: "1", name: "Life" },
  { id: "2", name: "Jobs" },
  { id: "3", name: "Cities" },
  { id: "4", name: "Health" },
  { id: "5", name: "Decades" },
  { id: "6", name: "Ages" },
  { id: "7", name: "Products" },
];

export const subjectCategories = ["Life", "Jobs", "Cities", "Health", "Decades", "Ages", "Products"];

export const topics: Topic[] = [
  // Life
  { id: "1", name: "Parent", categoryName: "Life", postCount: 142, topPosts: ["Keep dangerous chemicals out of reach", "Cutting food into small pieces prevents choking", "Sending kids to their room teaches isolation, not reflection", "Read to your kids every single night", "Never compare siblings to each other"], imageUrl: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=300&q=80" },
  { id: "5", name: "College", categoryName: "Life", postCount: 310, topPosts: ["Office hours are the most underused resource", "Start networking before senior year", "Sleep matters more than cramming", "Join at least one club outside your major", "Learn to cook before freshman year"], imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&q=80" },
  { id: "6", name: "Love", categoryName: "Life", postCount: 189, topPosts: ["Communication is everything", "Love languages are real", "Don't lose yourself in a relationship", "Trust is earned not given", "Fighting fair matters more than not fighting"], imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&q=80" },
  { id: "20", name: "Married", categoryName: "Life", postCount: 167, topPosts: ["Never stop dating each other", "Financial transparency is non-negotiable", "In-laws require boundaries", "Chores should be split fairly", "Always go to bed on speaking terms"], imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80" },
  { id: "21", name: "Pregnant", categoryName: "Life", postCount: 134, topPosts: ["Morning sickness can last all day", "Prenatal vitamins matter before conception", "Every pregnancy is different", "Trust your instincts over unsolicited advice", "Rest when you can in the third trimester"], imageUrl: "https://images.unsplash.com/photo-1493894473891-10fc1e5dbd22?w=300&q=80" },
  { id: "22", name: "Woman", categoryName: "Life", postCount: 245, topPosts: ["Negotiate your salary always", "Women's health research is underfunded", "Find your community early", "Self-care isn't selfish", "Your gut feeling is usually right"], imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&q=80" },
  { id: "23", name: "Man", categoryName: "Life", postCount: 198, topPosts: ["Vulnerability is strength", "Mental health check-ins save lives", "Learn emotional intelligence young", "Friendships need maintenance", "Being a good listener matters more than being right"], imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80" },
  { id: "24", name: "Poor", categoryName: "Life", postCount: 156, topPosts: ["Libraries are your best resource", "Learn to cook from scratch", "Community aid exists — ask for help", "Budgeting apps change everything", "Thrift stores have hidden gems"], imageUrl: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=300&q=80" },
  { id: "25", name: "Gay", categoryName: "Life", postCount: 178, topPosts: ["Coming out is a lifelong process", "Found family can be just as strong", "Know your rights in your state", "Pride isn't just a parade", "Representation in media matters"], imageUrl: "https://images.unsplash.com/photo-1562592306-54a127b5b6d4?w=300&q=80" },

  // Jobs
  { id: "2", name: "Waiter", categoryName: "Jobs", postCount: 98, topPosts: ["Some customers don't tip", "Memorize the menu your first week", "Always check on tables within 2 minutes", "Wear comfortable shoes every shift", "The kitchen staff is your best ally"], imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&q=80" },
  { id: "7", name: "Doctor", categoryName: "Jobs", postCount: 64, topPosts: ["Burnout is the biggest risk", "Patient rapport matters as much as diagnosis", "Residency changes you", "Documentation takes more time than patients", "Never stop learning after med school"], imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80" },
  { id: "30", name: "Accountant", categoryName: "Jobs", postCount: 87, topPosts: ["Tax season will consume your life", "Attention to detail is everything", "CPA exam is worth the pain", "Automation is changing the field", "Excel shortcuts save hours daily"], imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&q=80" },
  { id: "31", name: "Actor", categoryName: "Jobs", postCount: 73, topPosts: ["Rejection is the job", "Side hustles keep you alive", "Networking beats talent sometimes", "Take every audition seriously", "Your look is a type — own it"], imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" },
  { id: "32", name: "Advertiser", categoryName: "Jobs", postCount: 62, topPosts: ["Data drives creative decisions now", "Client feedback isn't personal", "Social media changed everything", "Deadlines are always yesterday", "The best ads tell stories"], imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&q=80" },
  { id: "33", name: "Architect", categoryName: "Jobs", postCount: 55, topPosts: ["School takes forever but is worth it", "AutoCAD is just the beginning", "Building codes are your bible", "Client vision vs. budget is the real challenge", "Site visits reveal everything drawings miss"], imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&q=80" },
  { id: "34", name: "Baby Sitter", categoryName: "Jobs", postCount: 91, topPosts: ["CPR certification is mandatory", "Set boundaries with parents early", "Screen time limits matter", "Always have backup activities planned", "Emergency contacts on the fridge"], imageUrl: "https://images.unsplash.com/photo-1587654780294-3ea10370d8e1?w=300&q=80" },
  { id: "35", name: "Banker", categoryName: "Jobs", postCount: 68, topPosts: ["Compliance rules change constantly", "Customer trust is everything", "Sales targets create pressure", "Financial literacy helps your own life", "Start studying for certifications early"], imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80" },
  { id: "36", name: "Bartender", categoryName: "Jobs", postCount: 104, topPosts: ["Know your classics before getting creative", "Cut people off diplomatically", "Tips are better on weekends", "Learn to read the room", "Stay sober on the job"], imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80" },
  { id: "37", name: "Carpenter", categoryName: "Jobs", postCount: 48, topPosts: ["Measure twice cut once is real", "Good tools are an investment", "Safety gear isn't optional", "Wood grain direction matters", "Apprenticeships teach what school can't"], imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80" },
  { id: "38", name: "Chef", categoryName: "Jobs", postCount: 112, topPosts: ["Mise en place saves your sanity", "Taste everything before it leaves the kitchen", "Burns and cuts are inevitable", "The hours will strain relationships", "Palate development never stops"], imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&q=80" },
  { id: "39", name: "Dentist", categoryName: "Jobs", postCount: 57, topPosts: ["Patient anxiety is your biggest challenge", "Ergonomics prevent career-ending injuries", "Keep up with technology changes", "Explain procedures in plain language", "Prevention is easier to sell than treatment"], imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300&q=80" },

  // Cities
  { id: "3", name: "Chicago", categoryName: "Cities", postCount: 215, topPosts: ["Deep dish pizza is everywhere", "The L train is essential", "Winter is brutal — dress in layers", "Summer festivals are the best part", "Neighborhoods each have their own personality"], imageUrl: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=300&q=80" },
  { id: "40", name: "New York City", categoryName: "Cities", postCount: 342, topPosts: ["Walking is faster than driving", "Rent will shock you", "The subway runs 24/7", "Every cuisine exists somewhere here", "Central Park is a lifesaver"], imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=300&q=80" },
  { id: "41", name: "Los Angeles", categoryName: "Cities", postCount: 287, topPosts: ["You need a car period", "Traffic defines your schedule", "The weather spoils you", "Hiking trails are world-class", "Brunch culture is real"], imageUrl: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=300&q=80" },
  { id: "42", name: "Houston", categoryName: "Cities", postCount: 156, topPosts: ["Tex-Mex is a food group", "Flooding happens fast", "Space Center is worth visiting", "Summers are brutally humid", "The medical center is world-renowned"], imageUrl: "https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=300&q=80" },
  { id: "43", name: "Atlanta", categoryName: "Cities", postCount: 178, topPosts: ["Traffic on 285 is legendary", "The food scene is underrated", "Hartsfield-Jackson is the busiest airport", "Peachtree is on every street name", "Southern hospitality is real"], imageUrl: "https://images.unsplash.com/photo-1575917649111-0cee4e5e9691?w=300&q=80" },
  { id: "44", name: "Detroit", categoryName: "Cities", postCount: 98, topPosts: ["The comeback is real", "Car culture runs deep", "Coney Islands are an institution", "Belle Isle is a hidden gem", "Music history is everywhere"], imageUrl: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=300&q=80" },
  { id: "45", name: "Dallas", categoryName: "Cities", postCount: 134, topPosts: ["Everything is bigger including portions", "BBQ arguments are serious", "The sprawl is real", "Cowboys football is a religion", "Cost of living is rising fast"], imageUrl: "https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=300&q=80" },
  { id: "46", name: "Miami", categoryName: "Cities", postCount: 201, topPosts: ["Spanish is basically required", "Hurricane season is no joke", "The beach lifestyle is addictive", "Nightlife starts at midnight", "Art Deco district is stunning"], imageUrl: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=300&q=80" },
  { id: "47", name: "San Francisco", categoryName: "Cities", postCount: 189, topPosts: ["Fog is a daily companion", "Tech culture is inescapable", "Housing costs are insane", "The food diversity is incredible", "Microclimates mean layers always"], imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&q=80" },

  // Health
  { id: "4", name: "Cancer", categoryName: "Health", postCount: 76, topPosts: ["Early detection saves lives", "Support groups make a real difference", "Ask your doctor about clinical trials", "Second opinions are always okay", "Treatment fatigue is real"], imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&q=80" },
  { id: "50", name: "Cold", categoryName: "Health", postCount: 45, topPosts: ["Rest is the only real cure", "Zinc may shorten duration", "Wash your hands constantly", "Chicken soup actually helps", "Stay home so you don't spread it"], imageUrl: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=300&q=80" },
  { id: "51", name: "Arthritis", categoryName: "Health", postCount: 67, topPosts: ["Movement helps more than rest", "Cold weather makes it worse", "Anti-inflammatory diet matters", "Physical therapy is underrated", "Joint protection techniques save pain"], imageUrl: "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=300&q=80" },
  { id: "52", name: "Covid", categoryName: "Health", postCount: 234, topPosts: ["Long Covid is real and debilitating", "Vaccines reduce severity", "Isolation affects mental health", "Testing before gatherings helps", "Symptoms vary wildly between people"], imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=300&q=80" },
  { id: "53", name: "Diabetes", categoryName: "Health", postCount: 145, topPosts: ["Blood sugar monitoring is life", "Carb counting becomes second nature", "Exercise lowers glucose naturally", "Type 1 and Type 2 are very different", "Community support keeps you accountable"], imageUrl: "https://images.unsplash.com/photo-1593491034932-844ab981ed7c?w=300&q=80" },
  { id: "54", name: "Obese", categoryName: "Health", postCount: 112, topPosts: ["It's a medical condition not a moral failing", "Small changes compound over time", "Food environment matters more than willpower", "Find movement you actually enjoy", "Mental health and weight are connected"], imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80" },
  { id: "55", name: "Heart Attack", categoryName: "Health", postCount: 89, topPosts: ["Know the warning signs", "Women's symptoms differ from men's", "Cardiac rehab is critical", "Lifestyle changes are non-negotiable after", "Time is muscle — call 911 fast"], imageUrl: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=300&q=80" },
  { id: "56", name: "Asthma", categoryName: "Health", postCount: 78, topPosts: ["Always carry your inhaler", "Triggers are personal — track yours", "Air quality apps are essential", "Exercise-induced asthma is manageable", "Action plans prevent ER visits"], imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&q=80" },

  // Decades
  { id: "8", name: "1980s", categoryName: "Decades", postCount: 52, topPosts: ["MTV changed everything", "Arcade culture was unmatched", "Reagan era shaped modern politics", "Hair bands defined a generation", "The Cold War was always in the background"], imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80" },
  { id: "60", name: "2020s", categoryName: "Decades", postCount: 198, topPosts: ["The pandemic changed work forever", "Remote work became the norm", "Social media reached peak influence", "Mental health awareness exploded", "AI changed everything overnight"], imageUrl: "https://images.unsplash.com/photo-1584931423298-c576fda54bd2?w=300&q=80" },
  { id: "61", name: "2010s", categoryName: "Decades", postCount: 167, topPosts: ["Smartphones became extensions of ourselves", "Streaming killed cable", "Social media shaped politics", "The gig economy emerged", "Marvel dominated entertainment"], imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&q=80" },
  { id: "62", name: "2000s", categoryName: "Decades", postCount: 143, topPosts: ["9/11 changed America forever", "The internet went mainstream", "Reality TV exploded", "iPod changed how we listen to music", "The housing crash was devastating"], imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80" },
  { id: "63", name: "1990s", categoryName: "Decades", postCount: 134, topPosts: ["Grunge defined a generation", "The internet was born", "Boy bands were inescapable", "Nickelodeon was peak kids TV", "The economy was booming"], imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&q=80" },
  { id: "64", name: "1970s", categoryName: "Decades", postCount: 78, topPosts: ["Disco was everywhere", "Watergate changed trust in government", "Punk rock was born", "Gas lines were a crisis", "Environmental movement started"], imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80" },
  { id: "65", name: "1960s", categoryName: "Decades", postCount: 67, topPosts: ["Civil rights movement changed America", "The moon landing united everyone", "Counterculture redefined norms", "Vietnam War divided the nation", "Rock and roll evolved"], imageUrl: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=300&q=80" },

  // Ages
  { id: "70", name: "Teens", categoryName: "Ages", postCount: 234, topPosts: ["Your brain isn't fully developed yet", "Social media pressure is real", "Friendships shift constantly", "Grades matter less than you think", "Find one adult you trust"], imageUrl: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=300&q=80" },
  { id: "71", name: "20s", categoryName: "Ages", postCount: 312, topPosts: ["It's okay to not have it figured out", "Save money even if it's small amounts", "Travel while you have fewer obligations", "Your first job won't be your last", "Invest in friendships intentionally"], imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=80" },
  { id: "72", name: "30s", categoryName: "Ages", postCount: 278, topPosts: ["Your metabolism actually changes", "Career pivots are still possible", "Quality friends over quantity", "Health screenings become important", "Work-life balance matters more now"], imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" },
  { id: "73", name: "40s", categoryName: "Ages", postCount: 198, topPosts: ["Midlife crisis isn't always dramatic", "Invest in your health now", "Kids grow up faster than expected", "Career satisfaction peaks or pivots", "Prioritize sleep seriously"], imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" },
  { id: "74", name: "50s", categoryName: "Ages", postCount: 156, topPosts: ["Retirement planning gets urgent", "Empty nest hits differently", "Regular health screenings are critical", "Reinvention is possible at any age", "Grandkids change your perspective"], imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80" },
  { id: "75", name: "60s", categoryName: "Ages", postCount: 134, topPosts: ["Retirement is a transition not an ending", "Stay physically active daily", "Social connections prevent decline", "Travel while health permits", "Downsize before you have to"], imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80" },
  { id: "76", name: "70s", categoryName: "Ages", postCount: 98, topPosts: ["Fall prevention is serious", "Stay mentally engaged", "Legacy planning matters", "Accept help when offered", "Every day is a gift"], imageUrl: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=300&q=80" },
  { id: "77", name: "80s", categoryName: "Ages", postCount: 67, topPosts: ["Routine keeps you sharp", "Family visits mean everything", "Hydration becomes critical", "Hearing aids change quality of life", "Share your stories with the young"], imageUrl: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=300&q=80" },
  { id: "78", name: "90s", categoryName: "Ages", postCount: 34, topPosts: ["You've seen more change than anyone", "Simplicity becomes beautiful", "Connection matters most", "Your wisdom is invaluable", "Live each day fully"], imageUrl: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=300&q=80" },
  { id: "79", name: "100s", categoryName: "Ages", postCount: 12, topPosts: ["You are a living treasure", "Genetics play a role but so does attitude", "Community kept you going", "Moderation in all things", "Laughter is the best medicine"], imageUrl: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=300&q=80" },

  // Products
  { id: "80", name: "iPhone", categoryName: "Products", postCount: 289, topPosts: ["Battery life anxiety is real", "AppleCare pays for itself", "Settings > Battery shows app drain", "Face ID changed everything", "Planned obsolescence is frustrating"], imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&q=80" },
  { id: "81", name: "Coke", categoryName: "Products", postCount: 145, topPosts: ["Mexican Coke tastes different", "Sugar content is alarming", "The secret formula is marketing genius", "Diet vs. regular debate never ends", "Nothing beats an ice cold can"], imageUrl: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&q=80" },
  { id: "82", name: "McDonald's", categoryName: "Products", postCount: 234, topPosts: ["The fries are engineered to be addictive", "Breakfast menu is the real star", "Ice cream machine is always broken", "Dollar menu saved college students", "Regional menu items are worth trying"], imageUrl: "https://images.unsplash.com/photo-1552526881-721ce8509abb?w=300&q=80" },
  { id: "83", name: "Facebook", categoryName: "Products", postCount: 178, topPosts: ["It's mostly for older generations now", "Marketplace replaced Craigslist", "Groups are the best feature", "Privacy settings need constant checking", "The algorithm shows what engages not what matters"], imageUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=300&q=80" },
  { id: "84", name: "Walmart", categoryName: "Products", postCount: 167, topPosts: ["Price matching saves real money", "Self-checkout lines are faster", "Great Value brand is surprisingly good", "Go early morning to avoid crowds", "Online pickup changed the game"], imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&q=80" },
  { id: "85", name: "Starbucks", categoryName: "Products", postCount: 198, topPosts: ["The secret menu is real", "Mobile ordering skips the line", "Sizes are intentionally confusing", "Loyalty program is actually good", "The coffee is overroasted on purpose"], imageUrl: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=300&q=80" },
  { id: "86", name: "Nike", categoryName: "Products", postCount: 156, topPosts: ["Quality has declined over the years", "Sales happen on a predictable cycle", "Air Max comfort is unmatched", "Sizing varies between models", "Resale culture ruined casual buying"], imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80" },
  { id: "87", name: "Amazon", categoryName: "Products", postCount: 312, topPosts: ["Reviews can be fake — check Fakespot", "Prime Day deals are often inflated", "Subscribe and Save is underused", "Return policy is incredibly generous", "Warehouse deals are hidden gems"], imageUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=300&q=80" },
];

export const posts: Post[] = [
  // Parent posts
  { id: "1", topicName: "Parent", categoryName: "Life", content: "Keep dangerous chemicals out of reach", username: "sarah_m", ratingScore: 891, ratingCount: 100, commentCount: 45, createdAt: hoursAgo(1), imageUrl: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&q=80" },
  { id: "2", topicName: "Parent", categoryName: "Life", content: "Cutting food into small pieces prevents choking", username: "dad_of_3", ratingScore: 856, ratingCount: 98, commentCount: 32, createdAt: hoursAgo(3) },
  { id: "7", topicName: "Parent", categoryName: "Life", content: "Sending kids to their room teaches isolation, not reflection", username: "mindful_mom", ratingScore: 760, ratingCount: 88, commentCount: 56, createdAt: hoursAgo(7) },
  { id: "18", topicName: "Parent", categoryName: "Life", content: "Read to your kids every single night", username: "book_parent", ratingScore: 920, ratingCount: 100, commentCount: 38, createdAt: hoursAgo(0.2) },
  { id: "100", topicName: "Parent", categoryName: "Life", content: "Never compare siblings to each other", username: "fair_parent", ratingScore: 845, ratingCount: 95, commentCount: 29, createdAt: hoursAgo(15) },

  // Waiter posts
  { id: "3", topicName: "Waiter", categoryName: "Jobs", content: "Some customers don't tip", username: "server_life", ratingScore: 890, ratingCount: 100, commentCount: 67, createdAt: hoursAgo(2) },
  { id: "11", topicName: "Waiter", categoryName: "Jobs", content: "Memorize the menu your first week", username: "tip_pro", ratingScore: 810, ratingCount: 92, commentCount: 19, createdAt: hoursAgo(0.5) },
  { id: "101", topicName: "Waiter", categoryName: "Jobs", content: "Always check on tables within 2 minutes", username: "table_turner", ratingScore: 780, ratingCount: 89, commentCount: 24, createdAt: hoursAgo(4.5) },
  { id: "102", topicName: "Waiter", categoryName: "Jobs", content: "Wear comfortable shoes every shift", username: "sore_feet", ratingScore: 820, ratingCount: 91, commentCount: 15, createdAt: hoursAgo(12) },
  { id: "103", topicName: "Waiter", categoryName: "Jobs", content: "The kitchen staff is your best ally", username: "team_player", ratingScore: 770, ratingCount: 86, commentCount: 22, createdAt: hoursAgo(18) },

  // Chicago posts
  { id: "4", topicName: "Chicago", categoryName: "Cities", content: "Deep dish pizza is everywhere", username: "chi_town", ratingScore: 780, ratingCount: 90, commentCount: 23, createdAt: hoursAgo(4) },
  { id: "12", topicName: "Chicago", categoryName: "Cities", content: "The L train is essential for getting around", username: "windy_city", ratingScore: 730, ratingCount: 84, commentCount: 15, createdAt: hoursAgo(1.5) },
  { id: "20p", topicName: "Chicago", categoryName: "Cities", content: "Winter is brutal — dress in layers", username: "frostbite", ratingScore: 770, ratingCount: 87, commentCount: 33, createdAt: hoursAgo(5.5) },
  { id: "104", topicName: "Chicago", categoryName: "Cities", content: "Summer festivals are the best part", username: "lolla_fan", ratingScore: 810, ratingCount: 93, commentCount: 27, createdAt: hoursAgo(8) },
  { id: "105", topicName: "Chicago", categoryName: "Cities", content: "Neighborhoods each have their own personality", username: "local_chi", ratingScore: 750, ratingCount: 85, commentCount: 19, createdAt: hoursAgo(20) },

  // Cancer posts
  { id: "5", topicName: "Cancer", categoryName: "Health", content: "Early detection saves lives", username: "dr_hope", ratingScore: 940, ratingCount: 100, commentCount: 89, createdAt: hoursAgo(5) },
  { id: "15", topicName: "Cancer", categoryName: "Health", content: "Support groups make a real difference", username: "survivor_22", ratingScore: 900, ratingCount: 99, commentCount: 44, createdAt: hoursAgo(11) },
  { id: "106", topicName: "Cancer", categoryName: "Health", content: "Ask your doctor about clinical trials", username: "research_hope", ratingScore: 870, ratingCount: 96, commentCount: 31, createdAt: hoursAgo(16) },
  { id: "107", topicName: "Cancer", categoryName: "Health", content: "Second opinions are always okay", username: "advocate_self", ratingScore: 880, ratingCount: 97, commentCount: 38, createdAt: hoursAgo(22) },
  { id: "108", topicName: "Cancer", categoryName: "Health", content: "Treatment fatigue is real", username: "fighter_on", ratingScore: 830, ratingCount: 92, commentCount: 41, createdAt: hoursAgo(30) },

  // College posts
  { id: "6", topicName: "College", categoryName: "Life", content: "Office hours are the most underused resource", username: "grad_2024", ratingScore: 820, ratingCount: 95, commentCount: 41, createdAt: hoursAgo(6) },
  { id: "13", topicName: "College", categoryName: "Life", content: "Sleep matters more than cramming", username: "wise_owl", ratingScore: 880, ratingCount: 97, commentCount: 52, createdAt: hoursAgo(2.5) },
  { id: "19", topicName: "College", categoryName: "Life", content: "Start networking before senior year", username: "career_first", ratingScore: 790, ratingCount: 89, commentCount: 27, createdAt: hoursAgo(0.8) },
  { id: "109", topicName: "College", categoryName: "Life", content: "Join at least one club outside your major", username: "well_rounded", ratingScore: 760, ratingCount: 87, commentCount: 18, createdAt: hoursAgo(14) },
  { id: "110", topicName: "College", categoryName: "Life", content: "Learn to cook before freshman year", username: "meal_prep", ratingScore: 740, ratingCount: 83, commentCount: 22, createdAt: hoursAgo(24) },

  // Love posts
  { id: "8", topicName: "Love", categoryName: "Life", content: "Communication is everything in a relationship", username: "heart_talk", ratingScore: 910, ratingCount: 100, commentCount: 73, createdAt: hoursAgo(8) },
  { id: "14", topicName: "Love", categoryName: "Life", content: "Don't lose yourself in a relationship", username: "solo_strong", ratingScore: 840, ratingCount: 93, commentCount: 61, createdAt: hoursAgo(3.5) },
  { id: "111", topicName: "Love", categoryName: "Life", content: "Love languages are real", username: "gift_giver", ratingScore: 860, ratingCount: 94, commentCount: 48, createdAt: hoursAgo(10) },
  { id: "112", topicName: "Love", categoryName: "Life", content: "Trust is earned not given", username: "slow_burn", ratingScore: 830, ratingCount: 91, commentCount: 35, createdAt: hoursAgo(17) },
  { id: "113", topicName: "Love", categoryName: "Life", content: "Fighting fair matters more than not fighting", username: "real_talk", ratingScore: 800, ratingCount: 90, commentCount: 42, createdAt: hoursAgo(26) },

  // Doctor posts
  { id: "9", topicName: "Doctor", categoryName: "Jobs", content: "Burnout is the biggest risk in medicine", username: "med_life", ratingScore: 870, ratingCount: 96, commentCount: 34, createdAt: hoursAgo(9) },
  { id: "16", topicName: "Doctor", categoryName: "Jobs", content: "Patient rapport matters as much as diagnosis", username: "doc_empathy", ratingScore: 860, ratingCount: 94, commentCount: 37, createdAt: hoursAgo(12) },
  { id: "114", topicName: "Doctor", categoryName: "Jobs", content: "Residency changes you", username: "resident_no_sleep", ratingScore: 840, ratingCount: 93, commentCount: 29, createdAt: hoursAgo(19) },
  { id: "115", topicName: "Doctor", categoryName: "Jobs", content: "Documentation takes more time than patients", username: "chart_slave", ratingScore: 810, ratingCount: 90, commentCount: 45, createdAt: hoursAgo(25) },
  { id: "116", topicName: "Doctor", categoryName: "Jobs", content: "Never stop learning after med school", username: "lifelong_learner", ratingScore: 790, ratingCount: 88, commentCount: 21, createdAt: hoursAgo(32) },

  // 1980s posts
  { id: "10", topicName: "1980s", categoryName: "Decades", content: "MTV changed the music industry forever", username: "retro_fan", ratingScore: 750, ratingCount: 85, commentCount: 28, createdAt: hoursAgo(10) },
  { id: "17", topicName: "1980s", categoryName: "Decades", content: "Arcade culture was unmatched", username: "pixel_kid", ratingScore: 720, ratingCount: 82, commentCount: 21, createdAt: hoursAgo(14) },
  { id: "117", topicName: "1980s", categoryName: "Decades", content: "Reagan era shaped modern politics", username: "history_buff", ratingScore: 690, ratingCount: 78, commentCount: 34, createdAt: hoursAgo(28) },
  { id: "118", topicName: "1980s", categoryName: "Decades", content: "Hair bands defined a generation", username: "glam_rock", ratingScore: 710, ratingCount: 80, commentCount: 18, createdAt: hoursAgo(35) },
  { id: "119", topicName: "1980s", categoryName: "Decades", content: "The Cold War was always in the background", username: "cold_warrior", ratingScore: 680, ratingCount: 76, commentCount: 25, createdAt: hoursAgo(40) },

  // New York City posts
  { id: "120", topicName: "New York City", categoryName: "Cities", content: "Walking is faster than driving", username: "nyc_walker", ratingScore: 890, ratingCount: 98, commentCount: 56, createdAt: hoursAgo(0.3), imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80" },
  { id: "121", topicName: "New York City", categoryName: "Cities", content: "Rent will shock you", username: "broke_nyc", ratingScore: 920, ratingCount: 100, commentCount: 78, createdAt: hoursAgo(1.2) },
  { id: "122", topicName: "New York City", categoryName: "Cities", content: "The subway runs 24/7", username: "late_train", ratingScore: 810, ratingCount: 92, commentCount: 33, createdAt: hoursAgo(6) },
  { id: "123", topicName: "New York City", categoryName: "Cities", content: "Every cuisine exists somewhere here", username: "foodie_nyc", ratingScore: 850, ratingCount: 94, commentCount: 41, createdAt: hoursAgo(13) },
  { id: "124", topicName: "New York City", categoryName: "Cities", content: "Central Park is a lifesaver", username: "park_lover", ratingScore: 780, ratingCount: 88, commentCount: 22, createdAt: hoursAgo(21) },

  // iPhone posts
  { id: "130", topicName: "iPhone", categoryName: "Products", content: "Battery life anxiety is real", username: "low_bat", ratingScore: 870, ratingCount: 96, commentCount: 52, createdAt: hoursAgo(0.7) },
  { id: "131", topicName: "iPhone", categoryName: "Products", content: "AppleCare pays for itself", username: "cracked_screen", ratingScore: 830, ratingCount: 92, commentCount: 38, createdAt: hoursAgo(4) },
  { id: "132", topicName: "iPhone", categoryName: "Products", content: "Settings > Battery shows app drain", username: "power_user", ratingScore: 810, ratingCount: 90, commentCount: 27, createdAt: hoursAgo(9) },
  { id: "133", topicName: "iPhone", categoryName: "Products", content: "Face ID changed everything", username: "face_unlock", ratingScore: 790, ratingCount: 88, commentCount: 19, createdAt: hoursAgo(16) },
  { id: "134", topicName: "iPhone", categoryName: "Products", content: "Planned obsolescence is frustrating", username: "old_phone", ratingScore: 860, ratingCount: 95, commentCount: 63, createdAt: hoursAgo(23) },

  // Married posts
  { id: "140", topicName: "Married", categoryName: "Life", content: "Never stop dating each other", username: "still_in_love", ratingScore: 910, ratingCount: 99, commentCount: 67, createdAt: hoursAgo(1.8) },
  { id: "141", topicName: "Married", categoryName: "Life", content: "Financial transparency is non-negotiable", username: "joint_account", ratingScore: 880, ratingCount: 96, commentCount: 45, createdAt: hoursAgo(5) },
  { id: "142", topicName: "Married", categoryName: "Life", content: "In-laws require boundaries", username: "boundary_setter", ratingScore: 850, ratingCount: 93, commentCount: 58, createdAt: hoursAgo(11) },
  { id: "143", topicName: "Married", categoryName: "Life", content: "Chores should be split fairly", username: "equal_partner", ratingScore: 820, ratingCount: 91, commentCount: 33, createdAt: hoursAgo(19) },
  { id: "144", topicName: "Married", categoryName: "Life", content: "Always go to bed on speaking terms", username: "peace_keeper", ratingScore: 800, ratingCount: 89, commentCount: 28, createdAt: hoursAgo(27) },

  // 20s posts
  { id: "150", topicName: "20s", categoryName: "Ages", content: "It's okay to not have it figured out", username: "figuring_it_out", ratingScore: 930, ratingCount: 100, commentCount: 82, createdAt: hoursAgo(0.4), imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80" },
  { id: "151", topicName: "20s", categoryName: "Ages", content: "Save money even if it's small amounts", username: "penny_saver", ratingScore: 870, ratingCount: 95, commentCount: 47, createdAt: hoursAgo(2) },
  { id: "152", topicName: "20s", categoryName: "Ages", content: "Travel while you have fewer obligations", username: "wanderlust", ratingScore: 890, ratingCount: 97, commentCount: 55, createdAt: hoursAgo(7) },
  { id: "153", topicName: "20s", categoryName: "Ages", content: "Your first job won't be your last", username: "career_hopper", ratingScore: 840, ratingCount: 93, commentCount: 31, createdAt: hoursAgo(15) },
  { id: "154", topicName: "20s", categoryName: "Ages", content: "Invest in friendships intentionally", username: "good_friend", ratingScore: 810, ratingCount: 90, commentCount: 26, createdAt: hoursAgo(22) },

  // McDonald's posts
  { id: "160", topicName: "McDonald's", categoryName: "Products", content: "The fries are engineered to be addictive", username: "fry_lover", ratingScore: 880, ratingCount: 97, commentCount: 64, createdAt: hoursAgo(1.3) },
  { id: "161", topicName: "McDonald's", categoryName: "Products", content: "Breakfast menu is the real star", username: "egg_mcmuffin", ratingScore: 850, ratingCount: 94, commentCount: 42, createdAt: hoursAgo(5.5) },
  { id: "162", topicName: "McDonald's", categoryName: "Products", content: "Ice cream machine is always broken", username: "mcflurry_denied", ratingScore: 900, ratingCount: 99, commentCount: 78, createdAt: hoursAgo(10) },
  { id: "163", topicName: "McDonald's", categoryName: "Products", content: "Dollar menu saved college students", username: "broke_student", ratingScore: 830, ratingCount: 92, commentCount: 35, createdAt: hoursAgo(18) },
  { id: "164", topicName: "McDonald's", categoryName: "Products", content: "Regional menu items are worth trying", username: "travel_eater", ratingScore: 790, ratingCount: 88, commentCount: 29, createdAt: hoursAgo(25) },
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

export const getTopicsByCategory = (categoryName: string): Topic[] =>
  topics.filter((t) => t.categoryName === categoryName);

export const getPostsByTopic = (topicName: string): Post[] =>
  posts
    .filter((p) => p.topicName === topicName)
    .sort((a, b) => {
      const avgA = getAverageRating(a);
      const avgB = getAverageRating(b);
      if (avgB !== avgA) return avgB - avgA;
      return b.ratingCount - a.ratingCount;
    });

export const getSubtitle = (topicName: string): string =>
  `What are the most important details of being a ${topicName}?`;
