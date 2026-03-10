export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  username: string;
  content: string;
  createdAt: Date;
  agreeCount: number;
  disagreeCount: number;
  heartCount: number;
}

export interface Post {
  id: string;
  topicName: string;
  categoryName: string;
  title?: string;
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
  { id: "8", name: "States" },
  { id: "9", name: "Countries" },
  { id: "10", name: "Colleges" },
  { id: "11", name: "Majors" },
  { id: "12", name: "Holidays" },
  { id: "13", name: "Sports" },
  { id: "14", name: "Teams" },
  { id: "15", name: "Nationalities" },
  { id: "16", name: "Religions" },
  { id: "17", name: "Pets" },
  { id: "18", name: "Clubs" },
  { id: "19", name: "Hobbies" },
  { id: "20", name: "Fanclubs" },
  { id: "21", name: "Events" },
  { id: "22", name: "Schools" },
  { id: "23", name: "Companies" },
  { id: "24", name: "Local Businesses" },
];

export const subjectCategories = ["Life", "Jobs", "Cities", "Health", "Decades", "Ages", "Products", "States", "Countries", "Colleges", "Majors", "Holidays", "Sports", "Teams", "Nationalities", "Religions", "Pets", "Clubs", "Hobbies", "Fanclubs", "Events", "Schools", "Companies", "Local Businesses"];

/** Row groupings for the Topics Directory page */
export const categoryRows: string[][] = [
  ["Life", "Health", "Jobs", "Cities", "States", "Countries", "Decades"],
  ["Colleges", "Majors", "Ages", "Holidays", "Sports", "Teams", "Nationalities"],
  ["Religions", "Pets", "Clubs", "Hobbies", "Products", "Companies", "Local Businesses"],
  ["Fanclubs", "Events", "Schools"],
];

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

  // States
  { id: "s1", name: "California", categoryName: "States", postCount: 320, topPosts: ["Cost of living is no joke", "The weather really is that good", "Traffic in LA defines your life"] },
  { id: "s2", name: "Texas", categoryName: "States", postCount: 280, topPosts: ["Everything is bigger", "BBQ is a religion", "Property taxes are high"] },
  { id: "s3", name: "Florida", categoryName: "States", postCount: 260, topPosts: ["Hurricane season is real", "No state income tax", "Humidity never quits"] },
  { id: "s4", name: "New York", categoryName: "States", postCount: 310, topPosts: ["Upstate is a different world", "Bagels really are better", "Winters are harsh"] },
  { id: "s5", name: "Illinois", categoryName: "States", postCount: 180, topPosts: ["Chicago runs the state", "Flat as a pancake", "Corruption is expected"] },
  { id: "s6", name: "Ohio", categoryName: "States", postCount: 120, topPosts: ["Surprisingly affordable", "Four seasons in one week", "Midwest nice is real"] },
  { id: "s7", name: "Georgia", categoryName: "States", postCount: 150, topPosts: ["Peaches and pecans everywhere", "Atlanta is booming", "Southern charm is real"] },
  { id: "s8", name: "Pennsylvania", categoryName: "States", postCount: 140, topPosts: ["Philly vs. Pittsburgh forever", "Amish country is fascinating", "Wawa is a way of life"] },
  { id: "s9", name: "Michigan", categoryName: "States", postCount: 130, topPosts: ["Great Lakes are underrated", "Detroit comeback is real", "Winters test your will"] },
  { id: "s10", name: "Colorado", categoryName: "States", postCount: 190, topPosts: ["Altitude sickness hits newcomers", "Outdoor paradise", "Craft beer capital"] },

  // Countries
  { id: "co1", name: "Japan", categoryName: "Countries", postCount: 245, topPosts: ["Politeness is built into the culture", "Trains run on time to the second", "Food is an art form"] },
  { id: "co2", name: "Mexico", categoryName: "Countries", postCount: 210, topPosts: ["The food puts American Mexican to shame", "Family is everything", "So much more than the border"] },
  { id: "co3", name: "Italy", categoryName: "Countries", postCount: 198, topPosts: ["Dinner starts at 9 PM", "Every region has its own cuisine", "History is everywhere you look"] },
  { id: "co4", name: "India", categoryName: "Countries", postCount: 230, topPosts: ["The diversity is staggering", "Spice levels are no joke", "Festivals happen constantly"] },
  { id: "co5", name: "Brazil", categoryName: "Countries", postCount: 175, topPosts: ["Carnival is life-changing", "Football is religion", "The Amazon is disappearing"] },
  { id: "co6", name: "Germany", categoryName: "Countries", postCount: 160, topPosts: ["Efficiency is a cultural value", "Beer gardens are sacred", "Public transit actually works"] },
  { id: "co7", name: "France", categoryName: "Countries", postCount: 185, topPosts: ["Bread is a daily ritual", "Work-life balance is real", "Paris isn't all of France"] },
  { id: "co8", name: "Australia", categoryName: "Countries", postCount: 170, topPosts: ["Everything can kill you is a myth", "The beaches are world-class", "Healthcare is actually good"] },
  { id: "co9", name: "South Korea", categoryName: "Countries", postCount: 155, topPosts: ["K-pop changed global music", "Work culture is intense", "Street food is incredible"] },
  { id: "co10", name: "Canada", categoryName: "Countries", postCount: 200, topPosts: ["Healthcare is free but slow", "Politeness is real", "Winters make Chicago look mild"] },

  // Colleges
  { id: "cl1", name: "Harvard", categoryName: "Colleges", postCount: 189, topPosts: ["The name opens doors forever", "Imposter syndrome is universal", "Grade inflation is real"] },
  { id: "cl2", name: "Stanford", categoryName: "Colleges", postCount: 175, topPosts: ["Startup culture is everywhere", "The weather helps your GPA", "Duck syndrome is real"] },
  { id: "cl3", name: "MIT", categoryName: "Colleges", postCount: 165, topPosts: ["Problem sets consume your life", "Collaboration is survival", "Hacking tradition is legendary"] },
  { id: "cl4", name: "UCLA", categoryName: "Colleges", postCount: 210, topPosts: ["Campus is gorgeous", "Dining halls are top-tier", "Parking is a nightmare"] },
  { id: "cl5", name: "Michigan", categoryName: "Colleges", postCount: 195, topPosts: ["Football Saturdays are sacred", "Ann Arbor is the perfect college town", "Winter is brutal"] },
  { id: "cl6", name: "NYU", categoryName: "Colleges", postCount: 180, topPosts: ["NYC is your campus", "No traditional campus feel", "Debt is the real degree"] },
  { id: "cl7", name: "Ohio State", categoryName: "Colleges", postCount: 200, topPosts: ["THE Ohio State University", "Campus is massive", "Football is everything"] },
  { id: "cl8", name: "UT Austin", categoryName: "Colleges", postCount: 185, topPosts: ["Keep Austin weird applies to campus", "Hook 'em Horns is a lifestyle", "The heat is relentless"] },
  { id: "cl9", name: "USC", categoryName: "Colleges", postCount: 170, topPosts: ["Trojan network is powerful", "Campus is beautiful", "Fight On forever"] },
  { id: "cl10", name: "UNC", categoryName: "Colleges", postCount: 160, topPosts: ["Chapel Hill is charming", "Tar Heel basketball is religion", "The rivalry with Duke is intense"] },

  // Majors
  { id: "mj1", name: "Computer Science", categoryName: "Majors", postCount: 310, topPosts: ["Leetcode grind is real", "Imposter syndrome never leaves", "The pay makes it worth it"] },
  { id: "mj2", name: "Business", categoryName: "Majors", postCount: 245, topPosts: ["Networking matters more than GPA", "Case studies get old fast", "Internships are everything"] },
  { id: "mj3", name: "Engineering", categoryName: "Majors", postCount: 280, topPosts: ["The workload is insane", "Study groups are survival", "Co-ops change everything"] },
  { id: "mj4", name: "Psychology", categoryName: "Majors", postCount: 190, topPosts: ["You need grad school to do anything", "Everyone thinks you can read minds", "Research methods is surprisingly hard"] },
  { id: "mj5", name: "Biology", categoryName: "Majors", postCount: 220, topPosts: ["Pre-med weeder courses are brutal", "Lab work is tedious but essential", "Memorization is the whole game"] },
  { id: "mj6", name: "English", categoryName: "Majors", postCount: 130, topPosts: ["Everyone asks what you'll do with it", "Writing skills transfer everywhere", "Reading 300 pages a week is normal"] },
  { id: "mj7", name: "Nursing", categoryName: "Majors", postCount: 200, topPosts: ["Clinical rotations are exhausting", "Job security is unmatched", "The emotional toll is real"] },
  { id: "mj8", name: "Finance", categoryName: "Majors", postCount: 175, topPosts: ["Excel is your best friend", "Wall Street recruiting starts freshman year", "The hours get worse after school"] },
  { id: "mj9", name: "Political Science", categoryName: "Majors", postCount: 140, topPosts: ["Debate skills are the real takeaway", "Law school isn't guaranteed", "Internships in DC change perspectives"] },
  { id: "mj10", name: "Art", categoryName: "Majors", postCount: 110, topPosts: ["Portfolio matters more than degree", "Critiques build thick skin", "Freelance hustle starts in school"] },

  // Holidays
  { id: "h1", name: "Christmas", categoryName: "Holidays", postCount: 290, topPosts: ["Start shopping in November", "Traditions matter more than gifts", "Family dynamics are tested"] },
  { id: "h2", name: "Thanksgiving", categoryName: "Holidays", postCount: 250, topPosts: ["The food coma is real", "Host burnout is underrated", "Leftovers are the best part"] },
  { id: "h3", name: "Halloween", categoryName: "Holidays", postCount: 220, topPosts: ["Start costume planning early", "Candy tax from your kids is valid", "Neighborhood decorations matter"] },
  { id: "h4", name: "Fourth of July", categoryName: "Holidays", postCount: 180, topPosts: ["Fireworks and pets don't mix", "BBQ is the main event", "Sunburn sneaks up on you"] },
  { id: "h5", name: "New Years", categoryName: "Holidays", postCount: 200, topPosts: ["Resolutions rarely stick", "Amateur night at every bar", "Staying in is underrated"] },
  { id: "h6", name: "Easter", categoryName: "Holidays", postCount: 150, topPosts: ["Egg hunts are chaos", "Brunch is the move", "Candy overload for weeks"] },
  { id: "h7", name: "Valentine's Day", categoryName: "Holidays", postCount: 190, topPosts: ["Restaurant prices double", "Expectations ruin it", "Galentine's Day is better"] },
  { id: "h8", name: "Mother's Day", categoryName: "Holidays", postCount: 160, topPosts: ["Brunch reservations fill fast", "Homemade gifts hit different", "Call your mom"] },
  { id: "h9", name: "Father's Day", categoryName: "Holidays", postCount: 130, topPosts: ["Dads say they want nothing", "Grilling together is the gift", "Quality time over stuff"] },
  { id: "h10", name: "Labor Day", categoryName: "Holidays", postCount: 110, topPosts: ["Last hurrah of summer", "White after Labor Day is fine", "Sales are actually good"] },

  // Sports
  { id: "sp1", name: "Football", categoryName: "Sports", postCount: 340, topPosts: ["Fantasy football ruins friendships", "CTE awareness changed the game", "Sunday is a sacred day"] },
  { id: "sp2", name: "Basketball", categoryName: "Sports", postCount: 310, topPosts: ["Pickup games teach life lessons", "The GOAT debate never ends", "March Madness is the best event"] },
  { id: "sp3", name: "Baseball", categoryName: "Sports", postCount: 230, topPosts: ["Games are too long now", "Ballpark food is half the experience", "Statistics run the sport"] },
  { id: "sp4", name: "Soccer", categoryName: "Sports", postCount: 270, topPosts: ["Growing fast in America", "World Cup unites everyone", "Youth soccer politics are insane"] },
  { id: "sp5", name: "Golf", categoryName: "Sports", postCount: 180, topPosts: ["It's harder than it looks", "Networking happens on the course", "Equipment costs add up fast"] },
  { id: "sp6", name: "Tennis", categoryName: "Sports", postCount: 150, topPosts: ["Great lifetime sport", "Court time is expensive", "The mental game is everything"] },
  { id: "sp7", name: "Swimming", categoryName: "Sports", postCount: 140, topPosts: ["Best full-body workout", "Chlorine damages everything", "5 AM practice builds character"] },
  { id: "sp8", name: "Hockey", categoryName: "Sports", postCount: 160, topPosts: ["Most expensive youth sport", "Playoff beards are tradition", "Fighting is part of the culture"] },
  { id: "sp9", name: "Boxing", categoryName: "Sports", postCount: 120, topPosts: ["Discipline over aggression", "Cardio is insane", "Sparring teaches humility"] },
  { id: "sp10", name: "Running", categoryName: "Sports", postCount: 200, topPosts: ["Runner's high is real", "Shoes matter more than anything", "Rest days prevent injury"] },

  // Teams
  { id: "tm1", name: "Lakers", categoryName: "Teams", postCount: 280, topPosts: ["Showtime legacy lives on", "LA fans are bandwagon", "Purple and gold is iconic"] },
  { id: "tm2", name: "Yankees", categoryName: "Teams", postCount: 260, topPosts: ["27 rings speak for themselves", "Most loved and hated team", "Pinstripes are classic"] },
  { id: "tm3", name: "Cowboys", categoryName: "Teams", postCount: 300, topPosts: ["America's Team is debatable", "Jerry Jones is the real show", "Haven't won since the 90s"] },
  { id: "tm4", name: "Patriots", categoryName: "Teams", postCount: 240, topPosts: ["Dynasty era was historic", "Deflategate won't die", "Post-Brady adjustment is real"] },
  { id: "tm5", name: "Warriors", categoryName: "Teams", postCount: 220, topPosts: ["Changed how basketball is played", "Splash Brothers era was magical", "Bay Area prices for tickets are insane"] },
  { id: "tm6", name: "Red Sox", categoryName: "Teams", postCount: 190, topPosts: ["Breaking the curse was legendary", "Fenway is a cathedral", "Rivalry with Yankees is eternal"] },
  { id: "tm7", name: "Bears", categoryName: "Teams", postCount: 170, topPosts: ["85 Bears were the greatest", "QB curse is real", "Soldier Field is too small"] },
  { id: "tm8", name: "Dodgers", categoryName: "Teams", postCount: 210, topPosts: ["LA traffic to the stadium is brutal", "Vin Scully was the voice", "Dodger Dogs are overrated"] },
  { id: "tm9", name: "Chiefs", categoryName: "Teams", postCount: 250, topPosts: ["Mahomes changed everything", "Arrowhead is the loudest stadium", "BBQ tailgates are elite"] },
  { id: "tm10", name: "Celtics", categoryName: "Teams", postCount: 200, topPosts: ["Most championships in NBA", "Boston sports fans are intense", "Rivalry with Lakers is legendary"] },

  // Nationalities
  { id: "n1", name: "American", categoryName: "Nationalities", postCount: 310, topPosts: ["Tipping culture confuses everyone", "Healthcare is a constant worry", "Diversity is the real strength"] },
  { id: "n2", name: "Mexican", categoryName: "Nationalities", postCount: 230, topPosts: ["Family gatherings are massive", "Food is an identity", "Work ethic is unmatched"] },
  { id: "n3", name: "Chinese", categoryName: "Nationalities", postCount: 210, topPosts: ["Education is prioritized above all", "Food varies wildly by region", "Lunar New Year is the biggest holiday"] },
  { id: "n4", name: "Indian", categoryName: "Nationalities", postCount: 220, topPosts: ["Arranged marriages still happen", "Cricket is life", "Festival calendar is packed"] },
  { id: "n5", name: "Italian", categoryName: "Nationalities", postCount: 180, topPosts: ["Gesturing is a language", "Sunday dinner is non-negotiable", "Coffee has strict rules"] },
  { id: "n6", name: "Irish", categoryName: "Nationalities", postCount: 160, topPosts: ["Pub culture is community", "The diaspora is massive", "Humor is a defense mechanism"] },
  { id: "n7", name: "Japanese", categoryName: "Nationalities", postCount: 190, topPosts: ["Respect is woven into language", "Punctuality is expected", "Work culture is demanding"] },
  { id: "n8", name: "Nigerian", categoryName: "Nationalities", postCount: 140, topPosts: ["Jollof rice debates are serious", "Education is highly valued", "Diaspora network is strong"] },
  { id: "n9", name: "Brazilian", categoryName: "Nationalities", postCount: 170, topPosts: ["Joy is cultural", "Football is identity", "Music is everywhere"] },
  { id: "n10", name: "Korean", categoryName: "Nationalities", postCount: 175, topPosts: ["Age hierarchy matters", "Food is communal", "Education pressure is intense"] },

  // Religions
  { id: "r1", name: "Christianity", categoryName: "Religions", postCount: 280, topPosts: ["Denominations differ wildly", "Community is the core value", "Sunday service structures the week"] },
  { id: "r2", name: "Islam", categoryName: "Religions", postCount: 220, topPosts: ["Ramadan changes your perspective", "Prayer five times a day is grounding", "Misconceptions are exhausting"] },
  { id: "r3", name: "Judaism", categoryName: "Religions", postCount: 180, topPosts: ["Shabbat is a weekly reset", "Food laws are complex", "History shapes identity deeply"] },
  { id: "r4", name: "Hinduism", categoryName: "Religions", postCount: 200, topPosts: ["Festivals are joyful chaos", "Multiple paths to the divine", "Vegetarianism is common"] },
  { id: "r5", name: "Buddhism", categoryName: "Religions", postCount: 190, topPosts: ["Meditation is the foundation", "Attachment causes suffering", "Mindfulness went mainstream"] },
  { id: "r6", name: "Atheism", categoryName: "Religions", postCount: 150, topPosts: ["Morality doesn't require religion", "Holiday awkwardness is real", "Community is harder to find"] },
  { id: "r7", name: "Sikhism", categoryName: "Religions", postCount: 110, topPosts: ["Langar feeds everyone equally", "Turbans are sacred", "Service to others is core"] },
  { id: "r8", name: "Agnostic", categoryName: "Religions", postCount: 130, topPosts: ["Uncertainty is honest", "Both sides claim you", "Spiritual without structure"] },

  // Pets
  { id: "p1", name: "Dogs", categoryName: "Pets", postCount: 340, topPosts: ["Adoption saves lives", "Training starts day one", "Vet bills add up fast"] },
  { id: "p2", name: "Cats", categoryName: "Pets", postCount: 300, topPosts: ["They choose you", "Litter box maintenance is real", "Independent doesn't mean unloving"] },
  { id: "p3", name: "Fish", categoryName: "Pets", postCount: 120, topPosts: ["Aquariums are therapeutic", "Water chemistry is everything", "More work than people think"] },
  { id: "p4", name: "Birds", categoryName: "Pets", postCount: 110, topPosts: ["They live surprisingly long", "Noise level varies wildly", "Intelligence is underestimated"] },
  { id: "p5", name: "Hamsters", categoryName: "Pets", postCount: 90, topPosts: ["Great first pet for kids", "Nocturnal so expect night noise", "Cages need regular cleaning"] },
  { id: "p6", name: "Rabbits", categoryName: "Pets", postCount: 100, topPosts: ["Not low-maintenance pets", "They need space to run", "Diet is mostly hay"] },
  { id: "p7", name: "Reptiles", categoryName: "Pets", postCount: 85, topPosts: ["Heating setup is critical", "Not cuddly but fascinating", "Research species before buying"] },
  { id: "p8", name: "Horses", categoryName: "Pets", postCount: 130, topPosts: ["Most expensive pet possible", "The bond is incredible", "Time commitment is massive"] },

  // Clubs
  { id: "cb1", name: "Book Club", categoryName: "Clubs", postCount: 150, topPosts: ["Pick books everyone can access", "Wine helps discussion", "Meeting consistency matters"] },
  { id: "cb2", name: "Running Club", categoryName: "Clubs", postCount: 140, topPosts: ["All paces welcome matters", "Social runs beat solo runs", "Race day bonding is special"] },
  { id: "cb3", name: "Wine Club", categoryName: "Clubs", postCount: 120, topPosts: ["Blind tastings are humbling", "Price doesn't equal quality", "Learn regions before grapes"] },
  { id: "cb4", name: "Chess Club", categoryName: "Clubs", postCount: 100, topPosts: ["Online play changed everything", "Patience is the first lesson", "Tournaments build confidence"] },
  { id: "cb5", name: "Garden Club", categoryName: "Clubs", postCount: 110, topPosts: ["Seed swaps are the best", "Community plots build friendships", "Start small and expand"] },
  { id: "cb6", name: "Debate Club", categoryName: "Clubs", postCount: 90, topPosts: ["Arguing both sides is enlightening", "Research skills transfer everywhere", "Public speaking fear fades"] },
  { id: "cb7", name: "Hiking Club", categoryName: "Clubs", postCount: 130, topPosts: ["Group safety is key", "Trail etiquette matters", "Nature heals"] },
  { id: "cb8", name: "Cooking Club", categoryName: "Clubs", postCount: 115, topPosts: ["Potlucks reveal hidden talents", "Theme nights are fun", "Recipes become family treasures"] },

  // Hobbies
  { id: "hb1", name: "Photography", categoryName: "Hobbies", postCount: 220, topPosts: ["Phone cameras are good enough to start", "Light is everything", "Edit less than you think"] },
  { id: "hb2", name: "Gardening", categoryName: "Hobbies", postCount: 200, topPosts: ["Start with herbs", "Composting changes everything", "Patience is the hardest part"] },
  { id: "hb3", name: "Cooking", categoryName: "Hobbies", postCount: 250, topPosts: ["Salt is the most important skill", "Mise en place saves sanity", "Fail forward with recipes"] },
  { id: "hb4", name: "Gaming", categoryName: "Hobbies", postCount: 290, topPosts: ["Moderation is key", "Online friends are real friends", "Backlogs are overwhelming"] },
  { id: "hb5", name: "Reading", categoryName: "Hobbies", postCount: 210, topPosts: ["Libraries are free", "Audiobooks count", "Don't finish bad books"] },
  { id: "hb6", name: "Woodworking", categoryName: "Hobbies", postCount: 140, topPosts: ["Start with hand tools", "Measure twice cut once", "Sawdust gets everywhere"] },
  { id: "hb7", name: "Painting", categoryName: "Hobbies", postCount: 160, topPosts: ["Acrylic is forgiving for beginners", "Color theory changes everything", "Every painting teaches something"] },
  { id: "hb8", name: "Fishing", categoryName: "Hobbies", postCount: 170, topPosts: ["Patience is the whole point", "Local knowledge beats gear", "Catch and release when possible"] },
  { id: "hb9", name: "Knitting", categoryName: "Hobbies", postCount: 130, topPosts: ["YouTube taught a generation", "Yarn addiction is real", "Handmade gifts mean more"] },
  { id: "hb10", name: "Cycling", categoryName: "Hobbies", postCount: 190, topPosts: ["Helmet always no exceptions", "Used bikes are great deals", "Commuting by bike changes your life"] },

  // Fanclubs
  { id: "fc1", name: "Taylor Swift", categoryName: "Fanclubs", postCount: 350, topPosts: ["Swifties are a force", "Era tours redefined concerts", "Easter eggs in everything"] },
  { id: "fc2", name: "Star Wars", categoryName: "Fanclubs", postCount: 280, topPosts: ["Original trilogy is sacred", "Fandom can be toxic", "Expanded universe is rich"] },
  { id: "fc3", name: "Marvel", categoryName: "Fanclubs", postCount: 300, topPosts: ["MCU fatigue is real", "Comic purists vs. movie fans", "Post-credit scenes started a trend"] },
  { id: "fc4", name: "BTS", categoryName: "Fanclubs", postCount: 320, topPosts: ["ARMY is global", "Music transcends language", "Fan projects are incredible"] },
  { id: "fc5", name: "Harry Potter", categoryName: "Fanclubs", postCount: 260, topPosts: ["Hogwarts house is an identity", "Rereading reveals new layers", "Separating art from artist is hard"] },
  { id: "fc6", name: "Disney", categoryName: "Fanclubs", postCount: 240, topPosts: ["Annual passes are addictive", "Nostalgia is powerful marketing", "Theme parks are overpriced"] },
  { id: "fc7", name: "Beyonce", categoryName: "Fanclubs", postCount: 230, topPosts: ["Beyhive is protective", "Surprise drops changed music", "Work ethic is unmatched"] },
  { id: "fc8", name: "The Office", categoryName: "Fanclubs", postCount: 210, topPosts: ["That's what she said never gets old", "Michael Scott is secretly brilliant", "UK vs. US debate continues"] },

  // Events
  { id: "ev1", name: "Weddings", categoryName: "Events", postCount: 270, topPosts: ["Budget doubles from initial estimate", "Guest list causes drama", "Vendor reviews save heartache"] },
  { id: "ev2", name: "Concerts", categoryName: "Events", postCount: 240, topPosts: ["Earplugs are essential", "GA vs. seats depends on the artist", "Merch lines are brutal"] },
  { id: "ev3", name: "Graduations", categoryName: "Events", postCount: 150, topPosts: ["Ceremonies are long but meaningful", "Photos matter more than you think", "Celebrate the journey not just the day"] },
  { id: "ev4", name: "Funerals", categoryName: "Events", postCount: 130, topPosts: ["Show up even if you don't know what to say", "Food trains help families", "Grief has no timeline"] },
  { id: "ev5", name: "Job Interviews", categoryName: "Events", postCount: 220, topPosts: ["Research the company thoroughly", "STAR method works", "Follow up within 24 hours"] },
  { id: "ev6", name: "First Dates", categoryName: "Events", postCount: 200, topPosts: ["Coffee dates are low pressure", "Ask questions and listen", "Be yourself not a performance"] },
  { id: "ev7", name: "Road Trips", categoryName: "Events", postCount: 190, topPosts: ["Playlist makes or breaks it", "Snacks are essential", "Detours are the best memories"] },
  { id: "ev8", name: "Moving Day", categoryName: "Events", postCount: 160, topPosts: ["Label everything", "Hire movers if you can", "First box: toilet paper and coffee maker"] },

  // Schools
  { id: "sc1", name: "Elementary School", categoryName: "Schools", postCount: 180, topPosts: ["Teachers shape lives", "Recess should be longer", "Homework in K-2 is unnecessary"] },
  { id: "sc2", name: "Middle School", categoryName: "Schools", postCount: 190, topPosts: ["Worst years for most people", "Social dynamics are brutal", "Puberty makes everything harder"] },
  { id: "sc3", name: "High School", categoryName: "Schools", postCount: 250, topPosts: ["It gets better after this", "Grades matter but not as much as you think", "Find your people"] },
  { id: "sc4", name: "Trade School", categoryName: "Schools", postCount: 140, topPosts: ["Undervalued path to great careers", "Hands-on learning is effective", "Less debt more skills"] },
  { id: "sc5", name: "Graduate School", categoryName: "Schools", postCount: 170, topPosts: ["Advisor relationship is everything", "Imposter syndrome is universal", "Funding matters more than ranking"] },
  { id: "sc6", name: "Law School", categoryName: "Schools", postCount: 160, topPosts: ["1L year is brutal", "Cold calls are terrifying", "Network starts day one"] },
  { id: "sc7", name: "Medical School", categoryName: "Schools", postCount: 155, topPosts: ["Anatomy lab changes you", "Step 1 defines your specialty options", "Sleep becomes a luxury"] },
  { id: "sc8", name: "Homeschool", categoryName: "Schools", postCount: 120, topPosts: ["Socialization requires effort", "Flexibility is the biggest perk", "Curriculum options are overwhelming"] },

  // Companies
  { id: "cp1", name: "Google", categoryName: "Companies", postCount: 260, topPosts: ["Perks are incredible", "Politics increase with scale", "Interview process is intense"] },
  { id: "cp2", name: "Apple", categoryName: "Companies", postCount: 240, topPosts: ["Secrecy culture is real", "Design thinking permeates everything", "Retail vs. corporate are different worlds"] },
  { id: "cp3", name: "Amazon", categoryName: "Companies", postCount: 280, topPosts: ["Leadership principles are everything", "PIP culture creates anxiety", "Day 1 mentality is real"] },
  { id: "cp4", name: "Microsoft", categoryName: "Companies", postCount: 220, topPosts: ["Culture changed under Nadella", "Work-life balance improved", "Teams dominates internal communication"] },
  { id: "cp5", name: "Tesla", categoryName: "Companies", postCount: 200, topPosts: ["Mission drives people", "Burnout rate is high", "Stock options are the real compensation"] },
  { id: "cp6", name: "Meta", categoryName: "Companies", postCount: 190, topPosts: ["Metaverse pivot confused everyone", "Engineering culture is strong", "Public perception weighs on morale"] },
  { id: "cp7", name: "Netflix", categoryName: "Companies", postCount: 170, topPosts: ["Freedom and responsibility culture", "Keeper test creates pressure", "Content strategy changes constantly"] },
  { id: "cp8", name: "JPMorgan", categoryName: "Companies", postCount: 150, topPosts: ["Analyst hours are brutal", "Training program is top-tier", "Dress code still matters"] },

  // Local Businesses
  { id: "lb1", name: "Coffee Shops", categoryName: "Local Businesses", postCount: 210, topPosts: ["Support local over chains", "WiFi policy matters", "Regulars become family"] },
  { id: "lb2", name: "Barbershops", categoryName: "Local Businesses", postCount: 160, topPosts: ["Find your barber and stay loyal", "Conversation is half the experience", "Cash tips go furthest"] },
  { id: "lb3", name: "Pizza Places", categoryName: "Local Businesses", postCount: 180, topPosts: ["Every town has a best slice debate", "Family-owned beats chains", "Lunch specials are the move"] },
  { id: "lb4", name: "Gyms", categoryName: "Local Businesses", postCount: 190, topPosts: ["Cancellation policies are predatory", "January crowds thin by March", "Community gyms beat big chains"] },
  { id: "lb5", name: "Bookstores", categoryName: "Local Businesses", postCount: 140, topPosts: ["Staff picks are usually great", "Events build community", "Buy local or lose local"] },
  { id: "lb6", name: "Hardware Stores", categoryName: "Local Businesses", postCount: 120, topPosts: ["Staff knowledge beats big box", "They'll cut keys and mix paint", "Supporting local keeps expertise alive"] },
  { id: "lb7", name: "Bakeries", categoryName: "Local Businesses", postCount: 150, topPosts: ["Morning pastries are worth early lines", "Custom cakes need advance notice", "Sourdough revival is real"] },
  { id: "lb8", name: "Auto Shops", categoryName: "Local Businesses", postCount: 130, topPosts: ["Honesty is the most valuable trait", "Get a second opinion on big repairs", "Referrals mean everything"] },
];

export const posts: Post[] = [
  // Parent posts
  { id: "1", topicName: "Parent", categoryName: "Life", title: "Keep dangerous chemicals out of reach", content: "This seems obvious but you'd be amazed how many parents overlook everyday household products. Dish soap under the sink, laundry pods that look like candy, bathroom cleaners on low shelves — toddlers are curious and fast. We installed magnetic cabinet locks on every lower cabinet in the house and it was the single best safety investment we made. The peace of mind alone is worth the $30. Also don't forget about purses left on the floor — medications, hand sanitizer, and even lip balm can be dangerous for small children.", username: "sarah_m", ratingScore: 891, ratingCount: 100, commentCount: 45, createdAt: hoursAgo(1), imageUrl: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&q=80" },
  { id: "2", topicName: "Parent", categoryName: "Life", title: "Cutting food into small pieces prevents choking", content: "Grapes, hot dogs, cherry tomatoes, popcorn — these are the top choking hazards for kids under 5 and most parents don't realize it until there's a scare. Cut grapes lengthwise, not across. Hot dogs should be quartered lengthwise then sliced. And honestly, skip popcorn entirely until age 4. We took an infant CPR class before our first was born and I'd recommend it to every parent. The confidence it gives you in those scary moments is invaluable.", username: "dad_of_3", ratingScore: 856, ratingCount: 98, commentCount: 32, createdAt: hoursAgo(3), imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" },
  { id: "7", topicName: "Parent", categoryName: "Life", title: "Sending kids to their room teaches isolation, not reflection", content: "When we started using 'time-ins' instead of 'time-outs,' the change in our daughter's behavior was dramatic. Instead of banishing her to her room when she acted out, we'd sit with her and help her name what she was feeling. 'You're frustrated because your brother took your toy.' It took longer in the moment but she started self-regulating much faster. The research backs this up — isolation during emotional distress teaches kids to suppress feelings rather than process them.", username: "mindful_mom", ratingScore: 760, ratingCount: 88, commentCount: 56, createdAt: hoursAgo(7) },
  { id: "18", topicName: "Parent", categoryName: "Life", title: "Read to your kids every single night", content: "We started reading to our son the day he came home from the hospital. By age 2, he was 'reading' his favorite books back to us from memory. By kindergarten, he was reading independently. The nightly routine isn't just about literacy — it's about connection, winding down, and creating a safe predictable end to each day. Even on nights when we're exhausted and tempted to skip it, we do at least one short book. The consistency matters more than the length.", username: "book_parent", ratingScore: 920, ratingCount: 100, commentCount: 38, createdAt: hoursAgo(0.2), imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80" },
  { id: "100", topicName: "Parent", categoryName: "Life", title: "Never compare siblings to each other", content: "'Why can't you be more like your sister?' is one of the most damaging things you can say to a child. Each kid is on their own developmental timeline with their own strengths and challenges. Comparison breeds resentment between siblings and erodes self-worth. Instead, we focus on individual progress: 'You've gotten so much better at sharing this week' rather than 'Your brother shares better than you.' We also make sure each child gets dedicated one-on-one time with each parent weekly.", username: "fair_parent", ratingScore: 845, ratingCount: 95, commentCount: 29, createdAt: hoursAgo(15) },

  // Waiter posts
  { id: "3", topicName: "Waiter", categoryName: "Jobs", title: "Some customers don't tip", content: "You will give flawless service — anticipate every need, nail every recommendation, time every course perfectly — and still get stiffed. It happens. The first few times it stings, but you learn not to internalize it. The key is tracking your averages over a week, not obsessing over individual tables. My average tip percentage stayed remarkably consistent at 20-22% regardless of individual outliers. Focus on volume and consistency, and the math works out.", username: "server_life", ratingScore: 890, ratingCount: 100, commentCount: 67, createdAt: hoursAgo(2), imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80" },
  { id: "11", topicName: "Waiter", categoryName: "Jobs", title: "Memorize the menu your first week", content: "I took photos of every page of the menu and studied them like flashcards during my commute. Within a week, I could describe every dish, list the ingredients, and recommend pairings without hesitation. This confidence translates directly into trust from your tables — and trust translates into tips. Know the allergens cold. Know which dishes can be modified and which can't. When a guest asks 'what's good here?' and you answer with genuine enthusiasm about a specific dish, you've just elevated the entire dining experience.", username: "tip_pro", ratingScore: 810, ratingCount: 92, commentCount: 19, createdAt: hoursAgo(0.5) },
  { id: "101", topicName: "Waiter", categoryName: "Jobs", title: "Always check on tables within 2 minutes", content: "The 2-minute check-back after food delivery is sacred. Not a drive-by 'everything okay?' while you're walking past — a genuine pause to make eye contact and confirm satisfaction. This is your window to catch problems before they fester. A cold entrée fixed immediately is a minor inconvenience; a cold entrée discovered 10 minutes later is a ruined meal and a bad tip. I also do a silent scan of water levels, napkin needs, and empty plates during this check.", username: "table_turner", ratingScore: 780, ratingCount: 89, commentCount: 24, createdAt: hoursAgo(4.5) },
  { id: "102", topicName: "Waiter", categoryName: "Jobs", title: "Wear comfortable shoes every shift", content: "I cannot overstate this. I went through three pairs of cheap shoes before investing in proper restaurant footwear and the difference was life-changing. You're on hard floors for 6-10 hours, pivoting, carrying heavy trays, navigating tight spaces. Dansko clogs, Birkenstock work shoes, or Shoes for Crews are the industry standards for a reason. Add gel insoles on top and your feet, knees, and back will thank you. This isn't a place to save money — good shoes are a career investment.", username: "sore_feet", ratingScore: 820, ratingCount: 91, commentCount: 15, createdAt: hoursAgo(12), imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { id: "103", topicName: "Waiter", categoryName: "Jobs", title: "The kitchen staff is your best ally", content: "Front-of-house and back-of-house tension is real in every restaurant, but the servers who build genuine relationships with the kitchen are the ones who thrive. Learn the cooks' names. Bring them a round of waters during a rush. When you need a favor — an expedited dish, a special modification, a remake — having that relationship is the difference between a 2-minute turnaround and a 15-minute wait. I've seen servers with great kitchen relationships consistently outperform those without.", username: "team_player", ratingScore: 770, ratingCount: 86, commentCount: 22, createdAt: hoursAgo(18) },

  // Chicago posts
  { id: "4", topicName: "Chicago", categoryName: "Cities", title: "Deep dish pizza is everywhere", content: "Here's the thing — deep dish is great but it's really a special occasion food, not what Chicagoans eat regularly. For everyday pizza, tavern-style thin crust cut into squares is the real Chicago staple. Pat's, Vito & Nick's, Marie's — these are the places locals go. Deep dish spots like Lou Malnati's and Giordano's are excellent but they're more of a 'friends visiting from out of town' experience. And don't sleep on the pan pizza at Pequod's — the caramelized cheese crust is its own category entirely.", username: "chi_town", ratingScore: 780, ratingCount: 90, commentCount: 23, createdAt: hoursAgo(4) },
  { id: "12", topicName: "Chicago", categoryName: "Cities", title: "The L train is essential for getting around", content: "The CTA is the backbone of Chicago transportation and learning it early saves you hours and money. The Red and Blue lines run 24/7 — memorize those first. The Brown Line is the most scenic and pleasant ride. Express buses during rush hour are often faster than trains for crosstown trips. Get a Ventra card your first day. Pro tip: stand right, walk left on escalators. Chicagoans take this very seriously.", username: "windy_city", ratingScore: 730, ratingCount: 84, commentCount: 15, createdAt: hoursAgo(1.5), imageUrl: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&q=80" },
  { id: "20p", topicName: "Chicago", categoryName: "Cities", title: "Winter is brutal — dress in layers", content: "Your first Chicago winter will test your resolve. The temperature is one thing, but the wind coming off Lake Michigan is what truly makes it brutal. Invest in a proper below-zero parka — not a fashion piece, a functional one. Layer with merino wool base layers, a fleece mid-layer, and a windproof shell. And take vitamin D supplements from November through March — the difference in mood is noticeable. The reward for surviving winter? Chicago summers are genuinely the best urban summer experience in America.", username: "frostbite", ratingScore: 770, ratingCount: 87, commentCount: 33, createdAt: hoursAgo(5.5) },
  { id: "104", topicName: "Chicago", categoryName: "Cities", title: "Summer festivals are the best part", content: "From June through September, Chicago transforms into an outdoor festival paradise. Lollapalooza gets all the press, but the neighborhood street festivals are where the real magic happens. Taste of Randolph, Do Division, Roscoe Village Burger Fest — every weekend there's something happening with live music, local food vendors, and incredible people-watching. Most are free or $5-10 suggested donation. The Millennium Park concert series is free world-class music every week.", username: "lolla_fan", ratingScore: 810, ratingCount: 93, commentCount: 27, createdAt: hoursAgo(8), imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80" },
  { id: "105", topicName: "Chicago", categoryName: "Cities", title: "Neighborhoods each have their own personality", content: "Chicago is really 77 neighborhoods stitched together, and picking the right one for your lifestyle is arguably the most important decision you'll make. Wicker Park and Logan Square for creative twentysomethings, Lincoln Park for young professionals, Pilsen for art and incredible Mexican food, Hyde Park for academics. Each has its own restaurant scene, bar culture, and community feel. Before signing a lease, spend a full weekend in the neighborhood — walk around Saturday morning AND Friday night.", username: "local_chi", ratingScore: 750, ratingCount: 85, commentCount: 19, createdAt: hoursAgo(20) },

  // Cancer posts
  { id: "5", topicName: "Cancer", categoryName: "Health", title: "Early detection saves lives", content: "The screening that caught my cancer was a routine check I almost skipped because I 'felt fine.' Stage 1 versus stage 3 is the difference between a straightforward treatment plan and a fight for your life. Know your family history, know your risk factors, and don't skip screenings. Mammograms, colonoscopies, skin checks, PSA tests — they're inconvenient and sometimes uncomfortable, but they save lives every single day. If you're putting off a screening right now, please schedule it this week.", username: "dr_hope", ratingScore: 940, ratingCount: 100, commentCount: 89, createdAt: hoursAgo(5) },
  { id: "15", topicName: "Cancer", categoryName: "Health", title: "Support groups make a real difference", content: "I resisted joining a support group for months because I didn't want to sit in a circle and cry with strangers. When I finally went, it was nothing like I expected. These were people who understood the 3 AM anxiety, the scan fears, the weird guilt. Having a room full of people who just 'get it' without you having to explain is profoundly therapeutic. I learned practical tips too — how to manage nausea, which anti-anxiety techniques actually work. Give it at least three sessions before deciding.", username: "survivor_22", ratingScore: 900, ratingCount: 99, commentCount: 44, createdAt: hoursAgo(11), imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&q=80" },
  { id: "106", topicName: "Cancer", categoryName: "Health", title: "Ask your doctor about clinical trials", content: "Clinical trials aren't a last resort — they're often access to the newest, most promising treatments before they're widely available. Ask at your very first oncology appointment: 'Am I eligible for any clinical trials?' Websites like clinicaltrials.gov can help you find relevant options. Participants in trials often receive extremely close monitoring and care. The trial I joined gave me access to an immunotherapy drug that became standard treatment two years later.", username: "research_hope", ratingScore: 870, ratingCount: 96, commentCount: 31, createdAt: hoursAgo(16) },
  { id: "107", topicName: "Cancer", categoryName: "Health", title: "Second opinions are always okay", content: "Your oncologist will not be offended if you seek a second opinion — and if they are, that's a red flag. Cancer treatment is complex and different specialists may have different approaches. I got three opinions before starting treatment and each one gave me slightly different information. Major cancer centers offer remote second opinions where you send your records. Insurance typically covers second opinions. This is your life — you deserve to feel confident in your treatment plan.", username: "advocate_self", ratingScore: 880, ratingCount: 97, commentCount: 38, createdAt: hoursAgo(22), imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
  { id: "108", topicName: "Cancer", categoryName: "Health", title: "Treatment fatigue is real", content: "Nobody warns you about the cumulative exhaustion. The first chemo cycle might not be too bad, but by cycle four or five, the fatigue compounds in ways that are hard to describe. It's not just physical tiredness — it's a bone-deep weariness that affects your mood, motivation, and cognition. What helped me: lowering my expectations dramatically. If I got dressed and ate breakfast, that was a productive day. I was honest with my care team about how I was feeling and they adjusted my treatment schedule.", username: "fighter_on", ratingScore: 830, ratingCount: 92, commentCount: 41, createdAt: hoursAgo(30) },

  // College posts
  { id: "6", topicName: "College", categoryName: "Life", title: "Office hours are the most underused resource", content: "Most professors sit in their office hours completely alone, waiting for students who never come. Going to office hours is how you build relationships that lead to research positions, strong recommendation letters, and mentorship. You don't need a specific question — you can go to discuss the material or just introduce yourself. The students who show up regularly are the ones who get the benefit of the doubt on borderline grades and the strongest references.", username: "grad_2024", ratingScore: 820, ratingCount: 95, commentCount: 41, createdAt: hoursAgo(6), imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80" },
  { id: "13", topicName: "College", categoryName: "Life", title: "Sleep matters more than cramming", content: "Your brain consolidates memories during sleep — this is neuroscience, not a wellness platitude. All-nighters literally work against learning. Studies show that students who sleep 7-8 hours before an exam consistently outperform those who stay up cramming. I switched from all-night cramming to studying 90 minutes per day with proper sleep and my GPA went up a full point. Sleep also affects mood, immune function, and decision-making.", username: "wise_owl", ratingScore: 880, ratingCount: 97, commentCount: 52, createdAt: hoursAgo(2.5) },
  { id: "19", topicName: "College", categoryName: "Life", title: "Start networking before senior year", content: "By senior year, everyone is scrambling to build connections for job applications. The students who start networking as sophomores and juniors have a massive advantage. Attend department events, join professional organizations, go to career fairs even when you're not job hunting. Informational interviews are incredibly underutilized — most professionals are happy to spend 20 minutes talking about their career path. I landed my first job through an alum I'd met at a casual department mixer two years earlier.", username: "career_first", ratingScore: 790, ratingCount: 89, commentCount: 27, createdAt: hoursAgo(0.8) },
  { id: "109", topicName: "College", categoryName: "Life", title: "Join at least one club outside your major", content: "Engineering majors who only hang out with engineers, business students who only network at business events — this is a trap. College is your best chance to meet people with wildly different perspectives. I was a CS major who joined the debate team, and it taught me communication skills that became my career differentiator. Employers love seeing diverse interests. The well-rounded candidate who can code AND communicate stands out in every interview.", username: "well_rounded", ratingScore: 760, ratingCount: 87, commentCount: 18, createdAt: hoursAgo(14) },
  { id: "110", topicName: "College", categoryName: "Life", title: "Learn to cook before freshman year", content: "The meal plan will sustain you but learning even five basic recipes before college gives you a massive quality-of-life advantage. Scrambled eggs, pasta with sauce, stir-fry, rice and beans, and a basic salad — that's enough to feed yourself for less than dining hall prices. By sophomore year when most students move off the meal plan, the ones who can cook are eating well for $50-60/week while everyone else is spending $15/day on takeout.", username: "meal_prep", ratingScore: 740, ratingCount: 83, commentCount: 22, createdAt: hoursAgo(24), imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80" },

  // Love posts
  { id: "8", topicName: "Love", categoryName: "Life", title: "Communication is everything in a relationship", content: "Most relationship problems aren't actually about the thing you're fighting about — they're about communication patterns. The dishes aren't really about the dishes; they're about feeling unappreciated. Learning to identify and express the underlying need ('I feel unvalued when...') instead of the surface complaint transformed my marriage. We started doing weekly check-ins where we each share one thing going well and one thing to work on. It prevents small frustrations from becoming explosive arguments.", username: "heart_talk", ratingScore: 910, ratingCount: 100, commentCount: 73, createdAt: hoursAgo(8), imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80" },
  { id: "14", topicName: "Love", categoryName: "Life", title: "Don't lose yourself in a relationship", content: "It happens gradually — you stop seeing your friends as often, drop your hobbies, mold your interests to match your partner's. Two years in, you look up and realize you don't know who you are outside the relationship. Maintaining your individual identity isn't just healthy for you; it's essential for the relationship. Partners who have their own friends, hobbies, and goals bring more to the partnership. Codependency feels like love but it's actually fear.", username: "solo_strong", ratingScore: 840, ratingCount: 93, commentCount: 61, createdAt: hoursAgo(3.5) },
  { id: "111", topicName: "Love", categoryName: "Life", title: "Love languages are real", content: "When my wife told me she didn't feel loved, I was baffled — I was doing everything I could think of. The problem: I was expressing love through acts of service when she needed words of affirmation. Once we both took the love languages assessment, everything clicked. We were both trying hard but speaking different emotional dialects. Understanding this framework saved us from years of feeling unloved despite being loved.", username: "gift_giver", ratingScore: 860, ratingCount: 94, commentCount: 48, createdAt: hoursAgo(10) },
  { id: "112", topicName: "Love", categoryName: "Life", title: "Trust is earned not given", content: "I used to give trust freely and pull it back when broken. Now I understand that trust is built incrementally through consistent small actions over time. Someone who keeps small promises — showing up when they say they will, being honest about small things — has earned your trust. Pay attention to patterns, not moments. How someone handles low-stakes situations tells you everything about how they'll handle high-stakes ones.", username: "slow_burn", ratingScore: 830, ratingCount: 91, commentCount: 35, createdAt: hoursAgo(17), imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80" },
  { id: "113", topicName: "Love", categoryName: "Life", title: "Fighting fair matters more than not fighting", content: "Couples who never fight aren't healthy — they're suppressing. The goal isn't to eliminate conflict; it's to handle it constructively. Fighting fair means: no name-calling, no bringing up old wounds, no stonewalling. It means taking breaks when things get too heated and using 'I feel' statements instead of accusations. My therapist taught us the 'repair attempt' concept — any gesture during a fight that tries to de-escalate should be received with grace. Accepting repair attempts is the strongest predictor of relationship success.", username: "real_talk", ratingScore: 800, ratingCount: 90, commentCount: 42, createdAt: hoursAgo(26) },

  // Doctor posts
  { id: "9", topicName: "Doctor", categoryName: "Jobs", title: "Burnout is the biggest risk in medicine", content: "Medical school doesn't prepare you for the emotional weight of the job. The patient losses, the impossible hours, the administrative burden, the moral injury of knowing what care your patient needs but being limited by insurance. Burnout rates among physicians hover around 50%. What saved me: therapy, firm boundaries around non-work time, a hobby completely unrelated to medicine, and a peer support group. The doctors who last are the ones who prioritize their own mental health.", username: "med_life", ratingScore: 870, ratingCount: 96, commentCount: 34, createdAt: hoursAgo(9), imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80" },
  { id: "16", topicName: "Doctor", categoryName: "Jobs", title: "Patient rapport matters as much as diagnosis", content: "A technically brilliant doctor with no bedside manner will have worse patient outcomes than a good doctor who communicates well. Patients who feel heard are more likely to follow treatment plans, return for follow-ups, and disclose important symptoms. I spend the first 2-3 minutes of every appointment just listening — not typing, not looking at the chart, just making eye contact. It costs me a few minutes per patient but diagnostic accuracy goes up because patients share more when they feel safe.", username: "doc_empathy", ratingScore: 860, ratingCount: 94, commentCount: 37, createdAt: hoursAgo(12) },
  { id: "114", topicName: "Doctor", categoryName: "Jobs", title: "Residency changes you", content: "You go into residency as one person and come out as another. The sleep deprivation, the responsibility, the exposure to suffering and death on a daily basis — it fundamentally rewires your brain. You develop emotional compartmentalization skills that are necessary for the job but can be destructive in personal relationships. Build your support system before residency starts. Maintain your non-medical friendships. And please, ask for help when you need it.", username: "resident_no_sleep", ratingScore: 840, ratingCount: 93, commentCount: 29, createdAt: hoursAgo(19) },
  { id: "115", topicName: "Doctor", categoryName: "Jobs", title: "Documentation takes more time than patients", content: "The cruel irony of modern medicine: I spend more time documenting care than providing it. Electronic health records were supposed to make things easier but instead created a documentation burden that adds 2+ hours to every workday. For every hour of patient face time, there's an estimated two hours of EHR and desk work. This is the number one driver of burnout in my specialty. We need scribes, we need better software, and we need to stop requiring physicians to be data entry clerks.", username: "chart_slave", ratingScore: 810, ratingCount: 90, commentCount: 45, createdAt: hoursAgo(25), imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80" },
  { id: "116", topicName: "Doctor", categoryName: "Jobs", title: "Never stop learning after med school", content: "Medicine evolves faster than any individual can keep up with, but you have to try. The treatment protocols I learned in residency are already outdated in some areas. I dedicate 30 minutes every morning to reading journals. I have a group text with colleagues where we share interesting cases and new research. The doctors who coast on what they learned in training become dangerous over time. Your patients deserve a physician who stays current.", username: "lifelong_learner", ratingScore: 790, ratingCount: 88, commentCount: 21, createdAt: hoursAgo(32) },

  // 1980s posts
  { id: "10", topicName: "1980s", categoryName: "Decades", title: "MTV changed the music industry forever", content: "Before MTV launched in 1981, music was primarily an audio experience. Suddenly, how you looked mattered as much as how you sounded. Artists like Duran Duran became massive stars through cinematic videos. The visual element transformed the entire industry — marketing, branding, concert production, everything. Those early years of MTV, when they actually played music videos 24/7, were a unique moment in cultural history that can't be replicated in the streaming era.", username: "retro_fan", ratingScore: 750, ratingCount: 85, commentCount: 28, createdAt: hoursAgo(10), imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80" },
  { id: "17", topicName: "1980s", categoryName: "Decades", title: "Arcade culture was unmatched", content: "There's nothing in modern gaming that replicates the arcade experience of the early '80s. The sound of quarters clinking, the glow of CRT screens in a dark room, the social pressure of playing with people watching over your shoulder. Games like Pac-Man and Donkey Kong weren't just entertainment — they were social venues. When you put your quarter on the machine to claim next game, that was a social contract everyone understood. Home consoles eventually killed arcades, and something was genuinely lost.", username: "pixel_kid", ratingScore: 720, ratingCount: 82, commentCount: 21, createdAt: hoursAgo(14) },
  { id: "117", topicName: "1980s", categoryName: "Decades", title: "Reagan era shaped modern politics", content: "Whether you agree with his policies or not, Ronald Reagan fundamentally reshaped American political discourse in ways we still feel today. The idea that government is 'the problem, not the solution,' supply-side economics, the emphasis on military strength — these all became dominant political themes that persist four decades later. Understanding the 1980s politically is essential context for understanding why American politics looks the way it does today.", username: "history_buff", ratingScore: 690, ratingCount: 78, commentCount: 34, createdAt: hoursAgo(28) },
  { id: "118", topicName: "1980s", categoryName: "Decades", title: "Hair bands defined a generation", content: "Mötley Crüe, Poison, Def Leppard, Bon Jovi — the hair metal era was loud, excessive, and unapologetically fun. The fashion was absurd, the music was catchy arena rock designed for singalongs. Critics dismissed it as shallow, but those songs endure because they captured a specific kind of youthful energy. When Nirvana killed hair metal in 1991, an entire aesthetic died with it. But go to any '80s night at a bar and watch people scream every word to 'Pour Some Sugar on Me' — that music still lives.", username: "glam_rock", ratingScore: 710, ratingCount: 80, commentCount: 18, createdAt: hoursAgo(35), imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80" },
  { id: "119", topicName: "1980s", categoryName: "Decades", title: "The Cold War was always in the background", content: "Growing up in the '80s meant nuclear anxiety was ambient. Movies like 'The Day After' reflected a genuine fear that civilization could end at any moment. We did nuclear drills in school. When the Berlin Wall fell in 1989, the collective exhale was palpable — a generation that had grown up with existential dread suddenly had hope. It's hard to explain to younger generations what it felt like to live under that constant low-level apocalyptic awareness.", username: "cold_warrior", ratingScore: 680, ratingCount: 76, commentCount: 25, createdAt: hoursAgo(40) },

  // New York City posts
  { id: "120", topicName: "New York City", categoryName: "Cities", title: "Walking is faster than driving", content: "In Manhattan, this is literally true for most trips under 2 miles. Between traffic, finding parking, and one-way streets, walking gets you there faster while being free and giving you exercise. New Yorkers walk an average of 2-5 miles per day without thinking about it. Invest in good walking shoes and learn the grid system — avenues run north-south, streets run east-west, and 20 blocks equals roughly one mile.", username: "nyc_walker", ratingScore: 890, ratingCount: 98, commentCount: 56, createdAt: hoursAgo(0.3), imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80" },
  { id: "121", topicName: "New York City", categoryName: "Cities", title: "Rent will shock you", content: "Whatever number you have in your head, add 30%. A studio in Manhattan averages $3,200/month. You'll need first month's rent, last month's rent, security deposit, and often a broker's fee. That's $10,000-15,000 just to move in. The 40x rule is standard: landlords want your annual income to be 40 times the monthly rent. Start your search on StreetEasy, avoid Craigslist scams, and be prepared to decide fast — good apartments are gone within hours.", username: "broke_nyc", ratingScore: 920, ratingCount: 100, commentCount: 78, createdAt: hoursAgo(1.2) },
  { id: "122", topicName: "New York City", categoryName: "Cities", title: "The subway runs 24/7", content: "NYC is one of the few cities in the world with a 24-hour subway system. Late-night trains are less frequent but they exist, which means you can go out at midnight and get home at 4 AM without a taxi. Learn your closest express and local stops — express trains skip stations and save significant time. Weekend service changes are the bane of every New Yorker — check the MTA alerts before heading out on weekends.", username: "late_train", ratingScore: 810, ratingCount: 92, commentCount: 33, createdAt: hoursAgo(6), imageUrl: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80" },
  { id: "123", topicName: "New York City", categoryName: "Cities", title: "Every cuisine exists somewhere here", content: "New York's food scene is a direct reflection of its immigrant communities. Flushing for authentic Chinese, Jackson Heights for Indian, Arthur Avenue for Italian, Brighton Beach for Russian, Sunset Park for Mexican. The best food is often in outer borough neighborhoods where immigrant communities have built authentic culinary traditions. A $6 plate of lamb over rice from a halal cart at 3 AM is as much a New York food experience as a $300 tasting menu.", username: "foodie_nyc", ratingScore: 850, ratingCount: 94, commentCount: 41, createdAt: hoursAgo(13) },
  { id: "124", topicName: "New York City", categoryName: "Cities", title: "Central Park is a lifesaver", content: "843 acres of green space in the middle of the most densely populated island in America. Runners use the loop, readers claim benches, musicians perform under the Bethesda Arcade. The real magic is in the less-visited areas: the North Woods feel like actual forest, the Conservatory Garden is a hidden gem, and the Reservoir at sunset is breathtaking. On days when the city feels overwhelming — and those days will come — Central Park reminds you why people put up with everything else.", username: "park_lover", ratingScore: 780, ratingCount: 88, commentCount: 22, createdAt: hoursAgo(21) },

  // iPhone posts
  { id: "130", topicName: "iPhone", categoryName: "Products", title: "Battery life anxiety is real", content: "That moment when you see 20% and you're two hours from home — every iPhone user knows the panic. After two years, lithium-ion batteries degrade to 80-85% capacity. Check yours at Settings > Battery > Battery Health. Optimization tips that actually work: reduce background app refresh, turn off unnecessary location services, use dark mode on OLED screens. A portable charger is essential gear, not optional.", username: "low_bat", ratingScore: 870, ratingCount: 96, commentCount: 52, createdAt: hoursAgo(0.7) },
  { id: "131", topicName: "iPhone", categoryName: "Products", title: "AppleCare pays for itself", content: "I was a 'I'll be careful' person who never bought phone insurance. Then I shattered my screen — $329 for an out-of-warranty repair. AppleCare+ costs $199 for two years and covers two incidents at $29 each for screens. One cracked screen and it's already saved you $100. It also covers battery replacement once capacity drops below 80%. After three broken screens, I will never skip AppleCare again.", username: "cracked_screen", ratingScore: 830, ratingCount: 92, commentCount: 38, createdAt: hoursAgo(4), imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&q=80" },
  { id: "132", topicName: "iPhone", categoryName: "Products", title: "Settings > Battery shows app drain", content: "Most people have no idea this feature exists. Go to Settings > Battery and scroll down — you'll see exactly which apps are consuming your battery over the last 24 hours. You'll often discover an app running in the background consuming 15-20% of your daily battery. Social media apps are typically the worst offenders. I check this weekly and it consistently adds 1-2 hours of daily battery life.", username: "power_user", ratingScore: 810, ratingCount: 90, commentCount: 27, createdAt: hoursAgo(9) },
  { id: "133", topicName: "iPhone", categoryName: "Products", title: "Face ID changed everything", content: "Remember typing passcodes? Face ID made that feel ancient overnight. The convenience cascades into everything — Apple Pay at checkout, autofill passwords, app authentication. The technology uses 30,000 infrared dots to map your face in 3D, works in the dark, and adapts as your appearance changes. It's one of those innovations that seems minor until you go back to a phone without it.", username: "face_unlock", ratingScore: 790, ratingCount: 88, commentCount: 19, createdAt: hoursAgo(16) },
  { id: "134", topicName: "iPhone", categoryName: "Products", title: "Planned obsolescence is frustrating", content: "Apple has gotten better about this, but the pattern is still visible: new iOS versions gradually slow older hardware, new features are limited to newer models, and repair costs make replacement more appealing. That said, iPhones do have the longest software support of any smartphone — 5-6 years. The real frustration is ecosystem lock-in: once you're invested in iCloud, AirPods, Apple Watch, and iMessage, switching to Android feels impossible. Apple knows this and prices accordingly.", username: "old_phone", ratingScore: 860, ratingCount: 95, commentCount: 63, createdAt: hoursAgo(23), imageUrl: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=400&q=80" },

  // Married posts
  { id: "140", topicName: "Married", categoryName: "Life", title: "Never stop dating each other", content: "After the wedding, it's easy to settle into routine — work, dinner, TV, sleep, repeat. The spark doesn't die from conflict; it dies from complacency. We committed to a weekly date night, even if it's just a walk and ice cream. The rule: no phones, no kids talk, no logistics. Just us. Marriage is a garden that dies without tending. The couples celebrating 50th anniversaries didn't get there by accident; they chose each other actively, every day.", username: "still_in_love", ratingScore: 910, ratingCount: 99, commentCount: 67, createdAt: hoursAgo(1.8), imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
  { id: "141", topicName: "Married", categoryName: "Life", title: "Financial transparency is non-negotiable", content: "Money is the number one cause of divorce, and it's almost always about secrets rather than the actual dollar amount. Before marriage, have the uncomfortable conversation: debts, credit scores, spending habits, financial goals. After marriage, maintain full transparency — joint access to all accounts, regular money check-ins. We use the 'yours, mine, ours' approach: joint account for shared expenses, small individual accounts for personal spending with no questions asked.", username: "joint_account", ratingScore: 880, ratingCount: 96, commentCount: 45, createdAt: hoursAgo(5) },
  { id: "142", topicName: "Married", categoryName: "Life", title: "In-laws require boundaries", content: "Your spouse chose you, but they also love their parents. The golden rule: each person handles their own parents. If your mother-in-law is overstepping, your spouse addresses it — not you. Common boundaries: no unannounced visits, no parenting criticism in front of the kids, holidays rotated fairly. Setting these boundaries early felt uncomfortable but saved us from years of resentment. Present them as 'we decided' not 'I want' — it shows a united front.", username: "boundary_setter", ratingScore: 850, ratingCount: 93, commentCount: 58, createdAt: hoursAgo(11) },
  { id: "143", topicName: "Married", categoryName: "Life", title: "Chores should be split fairly", content: "Fair doesn't mean equal — it means equitable based on your schedules, strengths, and preferences. My wife hates dishes; I hate laundry. So I do dishes, she does laundry, and we both feel like we got the better deal. We listed every household task, estimated weekly time, and divided them so the total burden was roughly equal. And when your partner does a task, don't critique how they did it. The goal is done, not done your way.", username: "equal_partner", ratingScore: 820, ratingCount: 91, commentCount: 33, createdAt: hoursAgo(19), imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" },
  { id: "144", topicName: "Married", categoryName: "Life", title: "Always go to bed on speaking terms", content: "The old advice 'never go to bed angry' is impractical — sometimes you're too tired to resolve things at midnight. What we've modified it to: always go to bed on speaking terms. You don't have to resolve the issue, but acknowledge it. A simple 'I'm still upset but I love you and we'll figure it out tomorrow' is enough. Going to bed in hostile silence is corrosive. Even a brief squeeze of the hand signals that the relationship is bigger than the argument.", username: "peace_keeper", ratingScore: 800, ratingCount: 89, commentCount: 28, createdAt: hoursAgo(27) },

  // 20s posts
  { id: "150", topicName: "20s", categoryName: "Ages", title: "It's okay to not have it figured out", content: "Social media makes it seem like everyone your age has a dream job, a perfect relationship, and a clear life plan. They don't. Most people in their 20s are quietly uncertain, changing direction multiple times. I changed careers twice, moved three times, and went through a period where I genuinely had no idea what I wanted. That confusion wasn't wasted time — it was exploration. Your 20s are for trying things, failing cheaply, and learning what you don't want almost as much as what you do.", username: "figuring_it_out", ratingScore: 930, ratingCount: 100, commentCount: 82, createdAt: hoursAgo(0.4), imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80" },
  { id: "151", topicName: "20s", categoryName: "Ages", title: "Save money even if it's small amounts", content: "I started saving $50/month at 22 and felt embarrassed it was so small. By 30, between contributions and compound interest, that habit had grown into a meaningful emergency fund. The amount matters less than the habit. Automate your savings so you never see the money. Even $25/month builds discipline that scales later. Open a high-yield savings account and start a Roth IRA even with small contributions. Your 30-year-old self will be profoundly grateful.", username: "penny_saver", ratingScore: 870, ratingCount: 95, commentCount: 47, createdAt: hoursAgo(2), imageUrl: "https://images.unsplash.com/photo-1554768804-50c1e2b50a6e?w=400&q=80" },
  { id: "152", topicName: "20s", categoryName: "Ages", title: "Travel while you have fewer obligations", content: "Before mortgages, kids, and career commitments — your 20s offer a unique window of freedom. Travel doesn't have to be expensive: hostels, budget airlines, house-sitting, and off-season timing make it accessible. I backpacked Southeast Asia for 6 weeks on $2,000 all-in. The experiences shaped my worldview more than any class. You'll develop independence, adaptability, and memories that compound in value over time.", username: "wanderlust", ratingScore: 890, ratingCount: 97, commentCount: 55, createdAt: hoursAgo(7) },
  { id: "153", topicName: "20s", categoryName: "Ages", title: "Your first job won't be your last", content: "The average person changes jobs 12 times in their career. Your first role isn't a life sentence — it's a learning opportunity. Extract every skill, relationship, and lesson you can, but don't feel trapped if it's not the right fit. I changed careers after three years and it was the best decision I ever made. But don't job-hop so fast that you never develop depth. Stay long enough to complete meaningful projects and leave on good terms.", username: "career_hopper", ratingScore: 840, ratingCount: 93, commentCount: 31, createdAt: hoursAgo(15), imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80" },
  { id: "154", topicName: "20s", categoryName: "Ages", title: "Invest in friendships intentionally", content: "In your 20s, friendships stop happening automatically. You're no longer surrounded by peers in classrooms. Maintaining friendships requires deliberate effort: scheduling hangouts, reaching out first, showing up for the unglamorous stuff. The friends you invest in during your 20s become your chosen family for life. Focus your energy on the people who reciprocate, who show up for you. Quality over quantity matters more with every passing year.", username: "good_friend", ratingScore: 810, ratingCount: 90, commentCount: 26, createdAt: hoursAgo(22) },

  // McDonald's posts
  { id: "160", topicName: "McDonald's", categoryName: "Products", title: "The fries are engineered to be addictive", content: "McDonald's fries are a marvel of food science. They're par-fried at the factory, frozen, then fried again for that perfect texture. The ingredient list includes beef flavoring, dextrose for color, and a specific salt crystal size optimized for taste bud coverage. They're best consumed within 5-7 minutes of serving. Pro tip: order them without salt and add your own — they'll make a fresh batch.", username: "fry_lover", ratingScore: 880, ratingCount: 97, commentCount: 64, createdAt: hoursAgo(1.3) },
  { id: "161", topicName: "McDonald's", categoryName: "Products", title: "Breakfast menu is the real star", content: "The Egg McMuffin is a perfect food — Canadian bacon, a real cracked egg, American cheese, on a toasted English muffin. Simple, balanced, and surprisingly reasonable at ~300 calories. McDonald's breakfast has a nostalgic quality that the rest of the menu doesn't match. Pro tips: the McGriddle is an engineering achievement (syrup baked INTO the bun) and the breakfast burritos are the best value on the menu.", username: "egg_mcmuffin", ratingScore: 850, ratingCount: 94, commentCount: 42, createdAt: hoursAgo(5.5), imageUrl: "https://images.unsplash.com/photo-1552526881-721ce8509abb?w=400&q=80" },
  { id: "162", topicName: "McDonald's", categoryName: "Products", title: "Ice cream machine is always broken", content: "This has become a cultural meme but the reality is interesting. The Taylor C602 machines require a 4-hour automated heat cleaning cycle every 24 hours. If that cycle fails, the machine locks and requires a certified technician. Taylor has been accused of designing machines that require expensive proprietary maintenance. The website mcbroken.com tracks machine status in real-time and consistently shows 10-15% of locations are down. It's a genuine engineering problem disguised as a punchline.", username: "mcflurry_denied", ratingScore: 900, ratingCount: 99, commentCount: 78, createdAt: hoursAgo(10) },
  { id: "163", topicName: "McDonald's", categoryName: "Products", title: "Dollar menu saved college students", content: "There was a golden era — roughly 2002-2013 — when the Dollar Menu was a genuine lifeline for people on tight budgets. A McDouble, small fries, and a drink for $3. The McChicken for $1 was the best value in fast food history. When they phased out the true dollar menu, it felt like losing a public service. Current prices make McDonald's less of a budget option and more mid-tier fast food. The nostalgia is really nostalgia for affordable, quick meals for working people.", username: "broke_student", ratingScore: 830, ratingCount: 92, commentCount: 35, createdAt: hoursAgo(18) },
  { id: "164", topicName: "McDonald's", categoryName: "Products", title: "Regional menu items are worth trying", content: "McDonald's adapts its menu to local tastes worldwide. Japan has the Teriyaki McBurger, India has the McAloo Tikki, Australia has the Chicken Parmi Burger, Germany has the McRib year-round. Even within the US, Hawaiian McDonald's serves spam and rice. When traveling, always check the local McDonald's menu — it's a window into local food culture filtered through the most standardized restaurant chain in the world.", username: "travel_eater", ratingScore: 790, ratingCount: 88, commentCount: 29, createdAt: hoursAgo(25), imageUrl: "https://images.unsplash.com/photo-1619454016518-697bc231e7cb?w=400&q=80" },
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

export const getTopicByName = (name: string): Topic | undefined =>
  topics.find((t) => t.name === name);

export const comments: Comment[] = [
  // Waiter post "Some customers don't tip" (id: "3")
  { id: "c1", postId: "3", parentCommentId: null, username: "former_server", content: "This is the hardest part of the job honestly. You give your best service and still get stiffed.", createdAt: hoursAgo(1.5), agreeCount: 24, disagreeCount: 3, heartCount: 8 },
  { id: "c2", postId: "3", parentCommentId: null, username: "tip_advocate", content: "Restaurants should just pay a living wage instead of relying on tips.", createdAt: hoursAgo(1.8), agreeCount: 45, disagreeCount: 18, heartCount: 12 },
  { id: "c3", postId: "3", parentCommentId: "c1", username: "server_life", content: "Exactly. You learn to not take it personally after a while.", createdAt: hoursAgo(1.2), agreeCount: 11, disagreeCount: 0, heartCount: 3 },
  { id: "c4", postId: "3", parentCommentId: "c2", username: "econ_nerd", content: "The tipping system is an American anomaly. Most countries pay servers properly.", createdAt: hoursAgo(1.0), agreeCount: 32, disagreeCount: 14, heartCount: 5 },
  { id: "c5", postId: "3", parentCommentId: "c4", username: "tip_advocate", content: "Agreed. But until that changes, please tip your servers.", createdAt: hoursAgo(0.8), agreeCount: 18, disagreeCount: 2, heartCount: 7 },

  // Waiter post "Memorize the menu" (id: "11")
  { id: "c6", postId: "11", parentCommentId: null, username: "new_hire", content: "I took photos of every page and studied them like flashcards.", createdAt: hoursAgo(0.3), agreeCount: 15, disagreeCount: 0, heartCount: 6 },
  { id: "c7", postId: "11", parentCommentId: null, username: "chef_mike", content: "As a chef, I love when servers actually know the ingredients. Helps with allergy questions.", createdAt: hoursAgo(0.4), agreeCount: 22, disagreeCount: 1, heartCount: 9 },

  // Parent post "Keep dangerous chemicals out of reach" (id: "1")
  { id: "c8", postId: "1", parentCommentId: null, username: "pediatric_nurse", content: "We see so many preventable poisoning cases. Cabinet locks are cheap and save lives.", createdAt: hoursAgo(0.8), agreeCount: 56, disagreeCount: 0, heartCount: 20 },
  { id: "c9", postId: "1", parentCommentId: null, username: "new_dad", content: "Don't forget about laundry pods. They look like candy to toddlers.", createdAt: hoursAgo(0.6), agreeCount: 38, disagreeCount: 2, heartCount: 14 },
  { id: "c10", postId: "1", parentCommentId: "c8", username: "sarah_m", content: "Thank you for sharing this. What brand of cabinet locks do you recommend?", createdAt: hoursAgo(0.5), agreeCount: 8, disagreeCount: 0, heartCount: 2 },
  { id: "c11", postId: "1", parentCommentId: "c10", username: "pediatric_nurse", content: "Magnetic locks are the best — kids can't figure them out and they're invisible.", createdAt: hoursAgo(0.4), agreeCount: 12, disagreeCount: 0, heartCount: 5 },

  // Parent post "Read to your kids every single night" (id: "18")
  { id: "c12", postId: "18", parentCommentId: null, username: "teacher_ann", content: "The kids who are read to at home are SO far ahead in literacy. It really shows.", createdAt: hoursAgo(0.1), agreeCount: 41, disagreeCount: 5, heartCount: 15 },
  { id: "c13", postId: "18", parentCommentId: null, username: "tired_parent", content: "Even when you're exhausted, even just 5 minutes makes a difference.", createdAt: hoursAgo(0.15), agreeCount: 29, disagreeCount: 0, heartCount: 11 },

  // College post "Office hours are the most underused resource" (id: "6")
  { id: "c14", postId: "6", parentCommentId: null, username: "prof_smith", content: "As a professor, I can confirm. I sit in my office hours alone most weeks. Come talk to us!", createdAt: hoursAgo(5), agreeCount: 67, disagreeCount: 3, heartCount: 23 },
  { id: "c15", postId: "6", parentCommentId: "c14", username: "shy_student", content: "I always felt like I was bothering professors. This makes me feel better about going.", createdAt: hoursAgo(4.5), agreeCount: 34, disagreeCount: 0, heartCount: 10 },
  { id: "c16", postId: "6", parentCommentId: "c14", username: "grad_2024", content: "Going to office hours is how I got my research position. Professors remember you.", createdAt: hoursAgo(4), agreeCount: 45, disagreeCount: 2, heartCount: 16 },

  // College post "Sleep matters more than cramming" (id: "13")
  { id: "c17", postId: "13", parentCommentId: null, username: "neuroscience_major", content: "Your brain consolidates memories during sleep. All-nighters literally work against you.", createdAt: hoursAgo(2), agreeCount: 52, disagreeCount: 7, heartCount: 18 },

  // Chicago post "Deep dish pizza is everywhere" (id: "4")
  { id: "c18", postId: "4", parentCommentId: null, username: "pizza_snob", content: "Hot take: tavern-style thin crust is the real Chicago pizza. Deep dish is for tourists.", createdAt: hoursAgo(3), agreeCount: 38, disagreeCount: 22, heartCount: 7 },
  { id: "c19", postId: "4", parentCommentId: "c18", username: "chi_town", content: "Both are great! But yeah, locals eat way more tavern-style.", createdAt: hoursAgo(2.5), agreeCount: 25, disagreeCount: 6, heartCount: 9 },
  { id: "c20", postId: "4", parentCommentId: null, username: "tourist_2024", content: "Lou Malnati's changed my life. I order it shipped to my house now.", createdAt: hoursAgo(3.5), agreeCount: 19, disagreeCount: 8, heartCount: 12 },

  // Chicago post "Winter is brutal" (id: "20p")
  { id: "c21", postId: "20p", parentCommentId: null, username: "snowbird", content: "The wind chill is the real enemy. -30 feels like another planet.", createdAt: hoursAgo(5), agreeCount: 33, disagreeCount: 0, heartCount: 4 },

  // Cancer post "Early detection saves lives" (id: "5")
  { id: "c22", postId: "5", parentCommentId: null, username: "survivor_5yr", content: "Caught mine at stage 1 because of a routine screening. I'm alive because of it.", createdAt: hoursAgo(4), agreeCount: 89, disagreeCount: 0, heartCount: 45 },
  { id: "c23", postId: "5", parentCommentId: "c22", username: "dr_hope", content: "Stories like yours are why we push for regular screenings. So glad you're here.", createdAt: hoursAgo(3.5), agreeCount: 56, disagreeCount: 0, heartCount: 30 },

  // McDonald's post "Ice cream machine is always broken" (id: "162")
  { id: "c24", postId: "162", parentCommentId: null, username: "mcworker", content: "It's not broken, it's in a 4-hour cleaning cycle. But we're told to just say it's broken.", createdAt: hoursAgo(9), agreeCount: 78, disagreeCount: 11, heartCount: 22 },
  { id: "c25", postId: "162", parentCommentId: "c24", username: "mcflurry_denied", content: "This is the insider info I needed. So there IS hope if I time it right?", createdAt: hoursAgo(8.5), agreeCount: 41, disagreeCount: 0, heartCount: 15 },
  { id: "c26", postId: "162", parentCommentId: "c25", username: "mcworker", content: "Go between 2-5pm. That's usually the sweet spot.", createdAt: hoursAgo(8), agreeCount: 55, disagreeCount: 4, heartCount: 19 },
];

export const addPost = (topicName: string, categoryName: string, content: string, username: string): Post => {
  const newPost: Post = {
    id: `user-${Date.now()}`,
    topicName,
    categoryName,
    content,
    username,
    ratingScore: 0,
    ratingCount: 0,
    commentCount: 0,
    createdAt: new Date(),
  };
  posts.push(newPost);
  return newPost;
};

export const getCommentsByPost = (postId: string): Comment[] =>
  comments
    .filter((c) => c.postId === postId && c.parentCommentId === null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

export const getReplies = (commentId: string): Comment[] =>
  comments
    .filter((c) => c.parentCommentId === commentId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
