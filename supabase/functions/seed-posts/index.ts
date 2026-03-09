import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for deterministic pseudo-random values
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Topic-specific post data: titles and multi-paragraph content
const topicPosts: Record<string, { titles: string[]; contents: string[] }> = {
  Parent: {
    titles: [
      "Sleep training saved our sanity",
      "The real cost of daycare nobody warns you about",
      "How to handle picky eaters without losing your mind",
      "Screen time limits that actually work",
      "Building a bedtime routine that sticks",
      "Managing sibling rivalry effectively",
      "When to let your kid fail and when to step in",
      "The mental load of parenting is real",
      "How to talk to your kids about money",
      "Finding yourself again after becoming a parent",
      "Co-parenting strategies that reduce conflict",
      "Teaching kids emotional regulation early",
      "The myth of the perfect parent",
      "How to handle public tantrums gracefully",
      "Setting boundaries with grandparents",
      "Making time for your marriage after kids",
      "Helping your child deal with bullies",
      "The importance of unstructured play",
      "Navigating school choice decisions",
      "How to apologize to your kids when you mess up",
    ],
    contents: [
      "We tried everything before sleep training — rocking, nursing, driving around the block at 2 AM. When we finally committed to a method at 6 months, it took three nights of tears (ours and his) but by night four, he was sleeping through. The key was consistency and having both parents fully committed to the plan. If one person caves, you're back to square one.\n\nWhat nobody tells you is that sleep regressions happen even after training. Every developmental milestone, every illness, every time change throws things off. But having that foundation means recovery is faster. Don't let anyone guilt you for sleep training — well-rested parents are better parents, period.",
      "Before our first was born, we budgeted $1,200/month for daycare. The actual cost? $2,100 in our area, and that's for a mid-range center. Add in the \"extras\" — diapers, wipes, sunscreen, spare clothes, holiday gifts for teachers — and you're looking at another $200/month easy. Then there are the sick days when they can't go but you still pay.\n\nThe hidden cost nobody mentions is the career impact. Someone has to leave work for every fever, every early pickup, every daycare closure. We ended up restructuring our entire work schedules. My advice: tour daycares and get on waitlists before the baby is even born. The good ones have 6-12 month waits. And negotiate your employer's flexibility before you need it.",
      "Our pediatrician told us something that changed everything: kids need to be exposed to a food 15-20 times before they truly don't like it. We were giving up after 3 tries. So we started the \"no thank you bite\" rule — you have to try one bite, and if you don't like it, you politely say no thank you. No drama, no forcing.\n\nThe game-changer was involving our kids in cooking. When our 4-year-old helped wash the lettuce and tear it for salad, suddenly she was eating salad. When our 6-year-old helped stir the soup, he wanted to taste his creation. Kids eat what they feel ownership over. Also, stop short-order cooking. We make one meal, and that's what's for dinner. They won't starve, I promise.",
      "We went cold turkey on weekday screens and it was the best decision we ever made. The first week was rough — lots of whining, lots of 'I'm bored.' By week two, our kids rediscovered books, building blocks, and actually playing together. Their behavior improved dramatically, sleep got better, and their attention spans noticeably lengthened.\n\nWeekends we allow some screen time, but with rules: no screens before 10 AM, no screens during meals, and they have to earn it by completing chores and reading for 30 minutes first. The key insight is that screens aren't inherently evil — it's the displacement of other activities that causes problems. When screens replace outdoor play, creative time, and social interaction, that's when you see issues.",
      "Our bedtime routine is sacred: bath, pajamas, two books, one song, lights out. Same order, same time, every single night. It took about two weeks to establish but now our kids practically put themselves to bed. The consistency is what makes it work — their bodies start winding down automatically when the routine begins.\n\nThe trick is starting the routine early enough that you're not rushing. We begin at 6:45 PM for a 7:30 PM lights out. That buffer means if someone needs extra story time or wants to talk about their day, there's room for it. Also, dim the lights in the house an hour before bed and cut all screens. The melatonin production difference is real and noticeable.",
    ],
  },
  Waiter: {
    titles: [
      "How to maximize tips on slow nights",
      "The art of reading a table in 30 seconds",
      "Surviving a double shift without burning out",
      "How to deal with difficult customers diplomatically",
      "The pre-shift routine that changed my income",
      "Wine knowledge that actually matters for tips",
      "Managing multiple tables without dropping quality",
      "The best non-slip shoes I've ever worn",
      "How to upsell without being pushy",
      "Building regulars is the real money move",
      "What to do when the kitchen is backed up",
      "How to handle table campers diplomatically",
      "The truth about tip pooling",
      "Learning to read the kitchen's rhythm",
      "How to handle split checks gracefully",
      "Working holidays: worth it or not?",
      "The side work nobody tells new servers about",
      "How to transition from casual to fine dining",
      "Managing your money when income is inconsistent",
      "When to cut your losses on a bad tip",
    ],
    contents: [
      "On slow nights, the temptation is to slack off, but that's when I actually make my best per-table tips. With fewer tables, I can give each one concierge-level attention. I learn their names, remember their drink orders, anticipate refills before they ask. I suggest appetizers as if I'm sharing a secret: 'Between us, the chef made something special tonight that's not on the menu yet.'\n\nThe other slow-night trick is befriending the bar. When you're not running food, hang near the bar and chat up the solo drinkers. They're often the most generous tippers because they appreciate the human connection. I've had $50 tips on $30 tabs from bar guests I took the time to actually talk to.",
      "In the first 30 seconds of greeting a table, I can tell you exactly what kind of service they want. Business dinner? Minimal interruption, efficient timing, no small talk. Date night? Warm but invisible, romantic pacing, suggest the specials with enthusiasm. Family with kids? Speed is everything — get those drinks and bread out immediately, take the kids' orders first.\n\nThe tells are in body language: if they're leaning toward each other talking, don't interrupt. If they're looking around the room, they need something. If menus are closed and stacked, they're ready to order. Reading these signals means I'm always one step ahead, and that's what gets 25%+ tips consistently.",
      "The secret to surviving doubles is preparation. I eat a real meal before my shift — protein, complex carbs, not just coffee. I bring a change of socks (trust me on this one). I keep ibuprofen, breath mints, and a phone charger in my locker. Between shifts, I sit down for 15 minutes minimum, even if I have to hide in the walk-in.\n\nMentally, I treat each shift as separate. Whatever happened at lunch — the rude table, the stiffed check — I leave it there. The dinner crowd is a clean slate. I also pace my energy differently on doubles: steady and efficient at lunch, then I turn on the charm for dinner when tips are higher. It's strategic energy management.",
      "The hardest lesson I learned was that difficult customers are rarely about you. They're stressed about work, fighting with their spouse, or just having a terrible day. My approach: kill them with kindness, validate their feelings, and fix the problem fast. 'I completely understand your frustration. Let me make this right immediately.'\n\nThe key is never getting defensive. Even when they're clearly wrong about what they ordered, I say 'I apologize for the confusion' rather than 'You ordered the salmon.' The goal isn't to win the argument — it's to turn the experience around. I've had my biggest tips from tables that started as my worst nightmares, because the recovery impressed them more than perfect service would have.",
      "Thirty minutes before every shift, I review the menu specials, check what's 86'd, and chat with the kitchen about what they're proud of tonight. Then I check my section assignment and mentally plan my table approach. I straighten my uniform, make sure my pens work, and take three deep breaths.\n\nThis routine sounds simple but it's the difference between walking in reactive and walking in proactive. When a guest asks about the special, I'm not fumbling — I'm describing it with genuine enthusiasm because I already tasted it. When they ask for a recommendation, I have three ready. Confidence sells, and preparation builds confidence. My tips went up 15% just from this pre-shift ritual.",
    ],
  },
  Chicago: {
    titles: [
      "The real neighborhoods to live in on a budget",
      "Surviving your first Chicago winter",
      "Best hidden food spots tourists don't know about",
      "CTA tips every new resident needs to know",
      "How to find an apartment without getting scammed",
      "The truth about Chicago's different neighborhoods",
      "Lake Michigan in summer is everything",
      "Biking in Chicago: infrastructure and reality",
      "How to make friends as a transplant",
      "The restaurant scene beyond deep dish",
      "Winter layering that actually works",
      "Best free things to do in Chicago",
      "How to deal with Chicago parking",
      "Navigating Chicago's job market",
      "The farmers market circuit worth following",
      "Why the South Side deserves more love",
      "Chicago tap water is actually amazing",
      "How to pick the right gym for Chicago winters",
      "The bar scene neighborhood by neighborhood",
      "Moving from the suburbs to the city",
    ],
    contents: [
      "Forget Lincoln Park and Lakeview if you're on a budget. Look at Pilsen, Bridgeport, Rogers Park, and Avondale. These neighborhoods have character, great food scenes, and rents that won't make you cry. Pilsen especially has incredible Mexican food, a strong arts community, and the Pink Line gets you downtown in 20 minutes.\n\nThe key to apartment hunting here is timing. Most leases turn over May 1 and October 1. Start looking 6-8 weeks before your target date. Walk the neighborhoods in person — some of the best deals are 'For Rent' signs in windows, not online listings. And always check the water pressure, look for signs of pests, and ask about heat costs. In Chicago, many vintage buildings have radiator heat included in rent, which saves you hundreds in winter.",
      "Your first Chicago winter will test you. Here's what I wish someone told me: invest in a real winter coat — not a fashion piece, a genuine below-zero parka. Spend the money on good boots with insulation ratings. Buy thermal underwear and actually wear it. Your California hoodie will betray you in January.\n\nThe mental game matters more than the gear. January and February are brutal, but they're survivable if you stay active. Join a gym, find indoor hobbies, and still force yourself outside on the days above 20°F. The Lakefront Trail in winter is actually beautiful and nearly empty. Also, vitamin D supplements are not optional — every Chicagoan I know takes them November through March. The reward for surviving winter? Chicago summers are genuinely the best urban summer experience in America.",
      "Skip Portillo's and Giordano's (they're fine, but they're tourist traps). For real deep dish, go to Pequod's — the caramelized cheese crust will change your life. For thin crust (what locals actually eat), Pat's Pizza on Lincoln is the standard. But the real Chicago food scene is global.\n\nDevon Avenue for Indian food is world-class — try Sabri Nihari for the nihari. Chinatown's Lao Sze Chuan has the best dry chili chicken I've ever had. Pilsen for Mexican — Birrieria Zaragoza serves birria that people drive hours for. And the taco trucks on 26th Street at midnight are a spiritual experience. For upscale, Alinea gets the press, but Oriole and Ever are where local foodies actually go. Chicago's food scene is genuinely one of the best in the world, and it's cheaper than NYC or LA.",
      "The CTA is your lifeline. Get a Ventra card immediately — the app works but the physical card is more reliable. The Blue Line runs 24/7 and connects O'Hare to downtown. The Red Line is the main north-south artery. Learn both of these first.\n\nPro tips: the Brown Line is the scenic route and the most pleasant ride. Express buses (like the J14) are often faster than trains during rush hour. Never rely on the bus tracker 100% — add 5 minutes to whatever it says. In winter, wait inside until you see the bus approaching. And the most important CTA rule: stand on the right side of the escalator, walk on the left. Violating this will earn you genuine hostility from your fellow commuters.",
      "Apartment scams are rampant on Craigslist and Facebook Marketplace. The number one rule: never send money before seeing the unit in person and meeting the landlord or management company. If the price seems too good to be true, it is. If they say they're 'out of the country' and will mail you keys, it's a scam.\n\nUse Domu, Apartments.com, and Zillow for legitimate listings, but also walk neighborhoods. Many Chicago landlords, especially in two-flats and three-flats, only advertise with window signs. These are often the best deals with the most responsive landlords. When you tour, bring a checklist: check water pressure, flush toilets, open/close all windows, look under sinks for leaks, check cell signal, and ask about laundry, storage, and parking. Get everything in writing.",
    ],
  },
  Cancer: {
    titles: [
      "Questions to ask your oncologist at the first appointment",
      "How to tell your family about your diagnosis",
      "Navigating insurance during treatment",
      "The emotional toll nobody prepares you for",
      "Finding the right support group",
      "Managing chemo side effects day by day",
      "How to keep working during treatment",
      "Nutrition during chemotherapy that helped me",
      "The importance of a second opinion",
      "How to accept help from others",
      "Dealing with scanxiety",
      "Hair loss: what to expect and how to cope",
      "Financial resources most patients don't know about",
      "Talking to your kids about cancer",
      "The caregiver's perspective matters too",
      "Staying active during treatment",
      "How to handle unsolicited advice",
      "Post-treatment surveillance anxiety",
      "Finding meaning during treatment",
      "The things that actually helped vs. what people think helps",
    ],
    contents: [
      "At your first oncologist appointment, you'll be overwhelmed. Bring someone with you to take notes — you won't remember half of what's said. Write down these questions beforehand: What is the exact type and stage? What are all my treatment options? What are the success rates for each? What clinical trials am I eligible for? What are the side effects and how will we manage them?\n\nAlso ask: How will this affect my daily life? When do we start? How long is the treatment plan? Who do I call if I have problems at 2 AM? Get the name and direct number of your oncology nurse — they will become your most important contact. Don't worry about asking 'too many' questions. A good oncologist expects and welcomes them.",
      "There is no perfect way to tell your family. I tried to wait until I had all the information — diagnosis, stage, treatment plan — so I could present it with some hope attached. 'I have cancer, but here's the plan to beat it.' That framing helped my family feel less helpless.\n\nFor kids, the guidance depends on age. Young children need simple, honest language: 'Mommy is sick and the doctors are giving her strong medicine. The medicine might make her tired and her hair might fall out, but the doctors are working hard to make her better.' Don't lie — kids sense dishonesty and it erodes trust. Older kids can handle more detail. Let them ask questions at their own pace. And if you cry in front of them, that's okay. It models that feelings are normal.",
      "Insurance becomes a part-time job during cancer treatment. First, get a case manager assigned through your insurance company — call and request one explicitly. They help pre-authorize treatments and navigate the bureaucracy. Second, keep a binder (physical or digital) of every bill, EOB, and correspondence.\n\nApply for financial assistance immediately, even if you think you don't qualify. Most hospital systems have charity care programs. The Patient Advocate Foundation and CancerCare both offer direct financial assistance. Pharmaceutical companies have copay assistance programs for expensive drugs. And don't ignore the bills that seem wrong — medical billing errors are extremely common. Question every charge that doesn't look right. Many hospitals will negotiate payment plans with zero interest if you simply ask.",
      "People focus on the physical side of cancer, but the emotional devastation is what almost broke me. The anxiety between scans, the depression during treatment, the weird guilt of being a burden, the anger at your own body — nobody prepares you for the mental health hurricane.\n\nWhat helped: therapy with someone who specializes in oncology patients (not general therapy — oncology-specific matters). A support group of people actually going through it, not just sympathetic friends. Allowing myself to have bad days without trying to be 'brave' or 'positive' all the time. The toxic positivity culture around cancer is harmful. You don't have to be a warrior every day. Sometimes you're just a person who's scared and exhausted, and that's completely valid.",
      "I almost didn't get a second opinion because I didn't want to 'waste time.' Getting that second opinion was the best decision of my treatment. The second oncologist recommended a different treatment protocol that had better outcomes for my specific cancer subtype. My original oncologist was good, but the second one was a specialist in exactly my type.\n\nHere's how to do it without awkwardness: most oncologists expect and support second opinions. Simply say, 'I'd like to get a second opinion for my own peace of mind.' Request your records be sent to the second doctor. Major cancer centers like MD Anderson, Sloan Kettering, and Mayo all offer remote second opinions where they review your pathology and imaging. Some insurance plans even require a second opinion for major treatment decisions. It's not an insult to your doctor — it's due diligence for your life.",
    ],
  },
  College: {
    titles: [
      "How to actually study effectively in college",
      "The truth about choosing a major",
      "Making friends after the first month",
      "How to email a professor properly",
      "Managing your money as a broke student",
      "Office hours are the biggest cheat code",
      "How to pick classes strategically",
      "The freshman 15 is avoidable",
      "Study groups that actually work",
      "How to handle a bad roommate",
      "Internships matter more than grades",
      "The library is your secret weapon",
      "How to recover from a bad semester",
      "Building relationships with professors",
      "Time management systems that work in college",
      "How to take notes that are actually useful",
      "The real value of campus involvement",
      "Handling homesickness without shame",
      "How to balance social life and academics",
      "What I wish I knew as a freshman",
    ],
    contents: [
      "Highlighting textbooks is not studying. It feels productive, but you're just doing a fancy form of reading. Active recall is what works: close the book and try to explain the concept from memory. Use flashcards (Anki is free and amazing). After each lecture, spend 10 minutes writing a summary without looking at your notes.\n\nThe Pomodoro technique changed my GPA: 25 minutes of focused work, 5 minute break, repeat. No phone during the 25 minutes — put it in another room. Study in the same place at the same time each day to build a habit. And start studying for exams at least a week before, reviewing a little each day. Cramming works for passing, but you won't actually learn anything, and that compounds over time.",
      "Don't stress about declaring a major freshman year. Take a variety of courses and see what makes you lose track of time. The major you choose matters way less than people think — most jobs just want a degree plus relevant experience. English majors become software engineers. Biology majors become bankers. The skills you develop matter more than the department name on your diploma.\n\nThat said, if you're considering something with specific career paths (engineering, nursing, accounting), those do require early commitment due to prerequisite chains. Talk to seniors in those majors about their experience. Talk to career services about job outcomes. And remember: you can always change your major. It might add a semester, but better to spend an extra semester than 40 years in the wrong field.",
      "Everyone makes their core friend group in the first two weeks and then thinks it's locked in. It's not. Some of my best college friendships formed sophomore and junior year through classes, clubs, and random encounters. The key is consistency — you become friends with people you see repeatedly in low-pressure settings.\n\nJoin two things: one related to your interests, one completely random. I joined the economics club (my major) and an intramural volleyball team (never played before). The volleyball team became my core friend group because we were all learning together and being bad at something together is incredibly bonding. Also, say yes to things. Someone invites you to a study group? Go. Free pizza event? Show up. The investment is small and the potential returns are massive.",
      "Professors get hundreds of terrible emails. Standing out is easy: use their correct title (Dr. or Professor, not 'Hey'), state your class and section, ask a specific question, and end with gratitude. Example: 'Dear Professor Smith, I'm in your Tuesday/Thursday Intro to Psych section (PSY 101). I'm having difficulty understanding the difference between classical and operant conditioning from this week's lecture. Could I stop by your office hours Thursday to discuss this? Thank you for your time.'\n\nNever email asking something that's in the syllabus — that shows you didn't bother to look. Don't send an email at 11 PM asking about an assignment due at midnight. And if you need an extension, ask before the deadline, not after, and provide a brief honest reason. Professors are human. They respect professionalism and they remember who showed it.",
      "I spent money like I had some in college. Venmo made it too easy — splitting dinners, buying drinks, ordering delivery. By November of freshman year, I'd blown through my savings. Here's what I learned: track every dollar for one month first. Most students have no idea where their money goes.\n\nCook basic meals in bulk on Sundays — rice, beans, and a protein will cost you $20 for the week. Use your meal plan strategically: grab fruit and bagels from the dining hall for snacks. Never buy textbooks at the campus bookstore — check the library reserve, rent from Chegg, or find international editions for 1/3 the price. And get a part-time job on campus: they work around your schedule, you avoid commuting, and having limited free time actually makes you more productive with studying.",
    ],
  },
  Love: {
    titles: [
      "How to know when it's real vs. infatuation",
      "The importance of fighting well together",
      "Attachment styles explained everything about my relationships",
      "Long distance survival guide",
      "When to compromise and when to hold firm",
      "The difference between loving someone and being in love",
      "How therapy saved my relationship",
      "Red flags I wish I hadn't ignored",
      "Building trust after it's been broken",
      "How to be vulnerable without being a doormat",
      "The role of physical touch in long-term relationships",
      "Dating in your 30s is actually better",
      "How to maintain independence in a relationship",
      "The conversation you need to have before moving in",
      "When to walk away from someone you love",
      "Learning to love yourself first isn't cliché",
      "How to communicate needs without nagging",
      "The slow love theory changed my perspective",
      "Recovering from heartbreak: a realistic timeline",
      "How to keep the spark alive after years together",
    ],
    contents: [
      "Infatuation is obsessive, anxious, and consuming. Real love is calm, secure, and steady. With infatuation, you can't stop thinking about them; with real love, you think about them often but you can also think about other things. Infatuation idealizes; love sees flaws and chooses to stay anyway.\n\nThe test that helped me: imagine them at their worst — sick, stressed, grumpy, unemployed. Do you still want to be their person? Infatuation crumbles under reality. Love leans in. Another sign: with infatuation, silence feels uncomfortable. With real love, you can sit in comfortable silence and it feels like home. Real love also grows slowly — if it felt like a lightning bolt on day one, that's chemistry, not love. Love is a slow build of trust, respect, and genuine knowing.",
      "Every couple fights. The difference between couples who last and those who don't isn't the absence of conflict — it's how they handle it. The Gottman research shows that contempt (eye-rolling, sarcasm, mockery) is the single biggest predictor of divorce. Eliminate contempt from your conflict style and you've won half the battle.\n\nFighting well means: no name-calling, ever. Take breaks when emotions are too high — say 'I need 20 minutes' and actually come back after 20 minutes. Use 'I feel' statements instead of 'You always.' And here's the big one: you're on the same team fighting the problem, not opponents fighting each other. After a fight, repair with genuine acknowledgment: 'I understand why that hurt you, and I'm sorry.' Repair attempts are the secret weapon of lasting relationships.",
      "Learning about attachment theory was like getting a cheat code for my love life. I'm anxious attachment — I need reassurance, fear abandonment, and overanalyze everything. I kept dating avoidant types — people who pull away when things get close. Classic anxious-avoidant trap: I chase, they flee, I chase harder, they flee further.\n\nOnce I understood this pattern, I could break it. I started dating people who were secure — people who texted back without games, who said what they meant, who didn't make me guess. It felt 'boring' at first because I'd confused anxiety with passion. But that steady, reliable feeling? That's actually what healthy love feels like. The butterflies of anxiety and the butterflies of excitement feel identical, but they have very different outcomes.",
      "My partner and I did long distance for two years. Here's what kept us together: scheduled video calls that were sacred — not negotiable. We had a 'morning text' ritual and a nightly call, even if it was just 10 minutes. Structure creates security when physical presence can't.\n\nThe harder truth: long distance works only if there's an end date. 'Indefinite long distance' is just slow-motion breaking up. We had a clear timeline: 18 months until she finished her program, then she'd move. That countdown kept us going through the lonely weekends. Also, visit regularly and alternate who travels. Send physical things — letters, care packages, a sweatshirt that smells like you. And have the hard conversations about fidelity, expectations, and jealousy before they become emergencies.",
      "I used to think compromise meant both people being equally unhappy. Actually, good compromise means finding creative solutions where both people feel heard. The key is distinguishing between preferences and values. Preferences are negotiable: which restaurant, where to vacation, who does which chore. Values are not: whether to have kids, financial philosophy, how to handle family.\n\nWhen you hit a values conflict, don't compromise — communicate. Sometimes what seems like a values conflict is actually a fear in disguise. 'I don't want to move to another city' might really mean 'I'm afraid of leaving my support system.' Addressing the fear opens solutions that pure compromise never would. And sometimes, after real honest conversation, you realize you're incompatible. That's not failure — that's clarity.",
    ],
  },
  Doctor: {
    titles: [
      "How to survive residency without losing yourself",
      "The patient interaction nobody teaches in med school",
      "Managing burnout before it manages you",
      "The art of delivering bad news",
      "How to handle difficult colleagues",
      "Work-life balance is a myth; work-life boundaries are real",
      "The financial mistakes young doctors make",
      "How to stay current with medical literature",
      "Building a good relationship with nurses",
      "When to trust your gut vs. follow the algorithm",
      "The emotional weight of losing a patient",
      "How to handle patient families effectively",
      "Transitioning from residency to practice",
      "The importance of a medical mentor",
      "How to document efficiently without cutting corners",
      "Dealing with imposter syndrome in medicine",
      "The business side of medicine nobody prepared me for",
      "How to handle medical errors honestly",
      "Finding joy in medicine after burnout",
      "Self-care strategies that actually work for physicians",
    ],
    contents: [
      "Residency will break you if you let it. The hours are inhumane, the responsibility is terrifying, and the hierarchy can be toxic. What saved me: finding three co-residents I could be honest with. Not performance-honest, genuinely honest. 'I cried in the supply closet today' honest. That vulnerability creates a support system that carries you through.\n\nAlso, maintain one thing outside of medicine. For me it was running. Even if it was just 20 minutes between shifts, that time was mine. Not medicine's, not the hospital's — mine. You need something that reminds you you're a person, not just a resident. And eat real food. The cafeteria at 3 AM becomes your kitchen, so learn what's decent there. Your body can't survive on vending machine coffee and granola bars for three years.",
      "Medical school teaches you the science of medicine but barely touches the art. The most important skill I developed was the 'sit-down.' When entering a patient's room, I sit down — even for 30 seconds. Studies show patients perceive seated doctors as spending significantly more time with them. It immediately changes the dynamic from rushed to caring.\n\nAlso, ask one non-medical question per visit. 'How are the grandkids?' 'Did your team win this weekend?' It takes 20 seconds and transforms the relationship. Patients who trust you are more compliant, more honest about symptoms, and more likely to return for follow-ups. Medicine is a relationship business, and the doctors who remember that are the ones who provide the best care and have the most fulfilling careers.",
      "I burned out in my third year of practice. Classic symptoms: cynicism toward patients, emotional numbness, dreading work, fantasizing about quitting. I ignored it for months because doctors are supposed to be tough. That denial made everything worse.\n\nWhat helped was admitting it wasn't weakness — it was occupational injury. I started therapy with a psychiatrist who specializes in physician burnout. I set hard boundaries: no email after 7 PM, one full day off per week with no work whatsoever. I rediscovered why I chose medicine by spending time with the patients who reminded me. And I said no more. To committees, to extra shifts, to the constant institutional ask for more of my time without more support. Boundaries aren't selfish — they're survival.",
      "Nobody teaches you how to tell someone they're dying. The first time I delivered a terminal diagnosis, I fumbled badly — too much medical jargon, too fast, not enough silence. The patient's face crumbled and I kept talking to fill the uncomfortable quiet. That was wrong.\n\nWhat I've learned since: use plain language, deliver the news, then stop talking. Let the silence sit. The patient needs time to absorb. Have tissues ready. Sit at their level. Touch their hand if appropriate. Then ask: 'What questions do you have?' Not 'Do you have questions' — the open-ended version gives permission. And always end with a plan: 'Here's what we're going to do next.' Even in terminal cases, a plan provides a sense of agency. The worst thing is feeling abandoned by your doctor after bad news.",
      "The biggest financial mistake I see young attendings make: lifestyle inflation the moment they start earning. After years of poverty in training, the temptation to buy the nice car, the house, the vacations is enormous. But you probably have $200-400K in student debt.\n\nLive like a resident for 2-3 more years after residency. Throw everything at your loans. Max out your 401k and backdoor Roth IRA from day one. Get disability insurance before anything else — your income is your biggest asset and one illness or injury can destroy it. Find a fee-only financial advisor who works with physicians (they understand our unique financial trajectory). And for the love of everything, don't let a financial 'advisor' sell you whole life insurance. It's almost never the right product for doctors.",
    ],
  },
  "1980s": {
    titles: [
      "The music that defined a generation",
      "Saturday morning cartoons were sacred",
      "The mall was our social media",
      "How MTV changed everything",
      "Arcades: the original gaming community",
      "The fashion we should never bring back",
      "Mixtapes were love letters",
      "The movies that shaped our worldview",
      "Playing outside until the streetlights came on",
      "The Cold War anxiety we grew up with",
      "Walkman changed how we experienced music",
      "The birth of the personal computer",
      "80s TV shows that still hold up",
      "The after-school special phenomenon",
      "Skating rinks were the place to be",
      "How 80s advertising shaped our consumer habits",
      "The Challenger disaster and childhood innocence",
      "80s toys that were actually dangerous",
      "Summer camps and sleepaway memories",
      "The rise of hip-hop culture",
    ],
    contents: [
      "The 80s gave us the greatest diversity of mainstream music in any decade. You had Michael Jackson, Prince, Madonna, Bon Jovi, Run-DMC, The Cure, Depeche Mode, and Whitney Houston all charting simultaneously. Radio wasn't algorithmic — you'd hear synth-pop followed by hair metal followed by early hip-hop, and it felt normal.\n\nWhat made it magical was the discovery process. You heard a song on the radio and had to go to the record store to find it. Sometimes you'd buy an album based on one single and discover the rest was completely different — and sometimes that discovery was better than the single. There was no Shazam, no Spotify. If you missed the DJ saying the song title, you'd hum it to the record store clerk and hope for the best.",
      "Every Saturday morning from 7 AM to noon was a ritual. You'd set up on the couch with a bowl of cereal — the sugariest one your parents would allow — and watch Transformers, G.I. Joe, Thundercats, He-Man, and whatever else came on. There was no pause, no rewind, no streaming. You either caught it or you waited a week.\n\nThe commercials were equally important — that's how you built your Christmas list. Every toy commercial was a masterclass in desire creation, and we were willing participants. But the real magic was the shared experience. Monday at school, everyone had watched the same episodes. It was common ground that crossed cliques. The jock and the nerd both watched Voltron, and for a few minutes in the hallway, that mattered.",
      "Before social media, the mall was where everything happened. You'd get dropped off on a Saturday afternoon with $10 and not come home for 6 hours. The food court was the gathering spot — Orange Julius, Sbarro, Mrs. Fields. You'd walk laps, see who was there, maybe catch a movie at the multiplex.\n\nSam Goody and Waldenbooks were destinations, not just stores. You'd spend an hour flipping through cassette tapes or browsing book covers. Spencer's Gifts was forbidden territory that everyone visited. The arcade in the mall was where reputations were built — being good at Pac-Man or Street Fighter earned real social capital. Shopping was almost secondary to the social function. The mall was our town square, our social network, and our entertainment center all in one climate-controlled building.",
      "When MTV launched on August 1, 1981, it changed American culture more than any other media event of the decade. Suddenly, music wasn't just audio — it was visual. Artists had to look as good as they sounded. It democratized music discovery in a way radio never could because you could see the artist, the style, the attitude.\n\nThe early days were the best: VJs who became celebrities, the world premiere of 'Thriller,' the first time you saw a-ha's 'Take On Me' video and your mind was blown by the animation. MTV also mainstreamed hip-hop and Black artists in ways that radio hadn't. When Run-DMC's 'Walk This Way' video played in heavy rotation, it bridged rock and rap in living rooms across America. The channel literally shaped how a generation understood style, rebellion, and cool.",
      "The arcade was the original social gaming experience. You'd walk in with a pocket full of quarters and the sound would hit you — the beeps, the button mashing, the occasional crowd gathering around someone on a hot streak. There was a social hierarchy based purely on skill, and the high score board was the original leaderboard.\n\nThe etiquette was unwritten but universally understood: put your quarter on the machine to claim next game. Don't give unsolicited advice. If someone is on a roll, you can watch but don't talk. The best players had audiences, and there was genuine respect for mastery. Games like Street Fighter II, Mortal Kombat, and later the fighting game boom created actual communities. Kids who might never interact otherwise became rivals and friends over shared competition. Nothing in modern gaming quite replicates that shoulder-to-shoulder experience.",
    ],
  },
  Gym: {
    titles: [
      "The beginner program that actually works",
      "Why compound lifts should be your foundation",
      "How to overcome gym intimidation",
      "The truth about supplements nobody tells you",
      "Recovery is where the gains actually happen",
      "How to build a consistent gym habit",
      "Proper form matters more than weight",
      "The best time to work out is when you'll actually go",
      "How to eat for muscle gain on a budget",
      "Cardio and lifting: finding the right balance",
      "Tracking your workouts changes everything",
      "The deload week saved my progress",
      "How to work out when motivation disappears",
      "Stretching and mobility: the unsexy essentials",
      "Why progressive overload is the only law",
      "How to pick a gym that fits your goals",
      "The gym bro advice that's actually wrong",
      "Working out with an injury: smart modifications",
      "Mind-muscle connection is real science",
      "How to break through a plateau",
    ],
    contents: [
      "If you're a beginner, forget the YouTube influencer split routines. Start with a full-body program three days a week: squats, bench press, barbell rows, overhead press, deadlifts. These five movements work every muscle in your body and build a foundation of strength that isolation exercises never will.\n\nDo 3 sets of 5-8 reps of each, focusing on adding a little weight each session. This linear progression works for months before you need anything more complicated. Programs like Starting Strength, StrongLifts 5x5, or GZCLP are proven and free. The biggest mistake beginners make is program hopping — picking a new routine every two weeks. Pick one program and run it for at least 12 weeks before evaluating. Consistency with a mediocre program beats perfection with no consistency every time.",
      "Compound lifts — squats, deadlifts, bench press, overhead press, rows, and pull-ups — should make up 80% of your training. They work multiple joints and muscle groups simultaneously, give you the most bang for your time, and build functional strength that translates to real life.\n\nThe squat alone works your quads, hamstrings, glutes, core, and back. No combination of leg extensions, leg curls, and hip thrusts replicates that stimulus as efficiently. Isolation work has its place — after your compounds are done. Think of it like building a house: compounds are the foundation and framing, isolation is the interior decorating. Nobody hangs curtains before the walls are up. And compound lifts trigger a greater hormonal response (growth hormone, testosterone) than isolation work, which means better gains everywhere, not just the muscles directly worked.",
      "Every single person in the gym started exactly where you are. That huge guy benching 315? He once struggled with the empty bar. That fit woman doing pull-ups? She once couldn't do one. Everyone is too focused on their own workout to judge yours.\n\nTo get over gym anxiety: go during off-peak hours first (early morning or mid-afternoon). Have a written plan before you walk in — knowing exactly what you're doing eliminates the awkward wandering. Start with machines if free weights feel intimidating; there's no shame in that. Wear headphones and focus on your own reflection. And here's a secret: the biggest, most experienced lifters are usually the nicest people in the gym. If you ask one for help, 90% of the time they'll be thrilled to share knowledge. The gym is one of the few remaining places where strangers genuinely help each other.",
      "The supplement industry is 90% marketing and 10% science. Here's what actually works, backed by decades of research: creatine monohydrate (5g daily, every day, no loading phase needed), caffeine (before workouts), protein powder (only if you can't hit your protein goals through food), and vitamin D if you're deficient.\n\nEverything else — BCAAs, testosterone boosters, fat burners, pre-workout with 47 ingredients — is either useless or just expensive caffeine. BCAAs are a waste if you eat enough protein. 'Natural testosterone boosters' don't boost testosterone in any meaningful way. Fat burners are caffeine plus filler. Save your money and spend it on quality food instead. One exception: if you're over 40, fish oil and magnesium are worth considering. But the supplement that makes the biggest difference? Sleep. Eight hours of sleep does more for your gains than any powder on the shelf.",
      "You don't grow in the gym — you grow recovering from the gym. Training breaks down muscle fibers; rest, nutrition, and sleep rebuild them stronger. If you're training hard six days a week and not seeing results, you're probably overtraining and under-recovering.\n\nSleep 7-9 hours. This is non-negotiable. Growth hormone peaks during deep sleep, and sleep deprivation directly reduces testosterone and increases cortisol. Eat enough protein (0.7-1g per pound of bodyweight) spread across the day. Stay hydrated. And take rest days seriously — that doesn't mean lying on the couch all day. Active recovery like walking, light stretching, or swimming increases blood flow to muscles without adding training stress. If you're consistently sore for more than 48 hours, you're doing too much. Dial it back and watch your progress actually improve.",
    ],
  },
  Cooking: {
    titles: [
      "The knife skills that make everything faster",
      "How to season food properly",
      "Mise en place will change your cooking",
      "The five mother sauces every cook should know",
      "How to meal prep without eating sad food",
      "Cast iron care is simpler than you think",
      "The pantry staples that make any meal possible",
      "How to cook rice perfectly every time",
      "Knife sharpening is the most overlooked skill",
      "How to read a recipe like a professional",
      "The Maillard reaction is your best friend",
      "How to balance flavors like a chef",
      "Stock from scratch: easier than you think",
      "The one-pan dinner approach",
      "How to cook for someone with dietary restrictions",
      "Mistakes that actually teach you the most",
      "How to improvise in the kitchen",
      "Batch cooking sauces saves weeknights",
      "Temperature control is everything",
      "How to taste as you go",
    ],
    contents: [
      "A sharp knife and solid technique will cut your prep time in half and make cooking more enjoyable. Start with three cuts: the rock chop (for herbs and vegetables), the slice (for proteins), and the dice. Keep your non-cutting hand in a claw position — fingertips tucked, knuckles guiding the blade. This protects your fingers and gives you precision.\n\nInvest in one good chef's knife (8-inch) rather than a full block set. A Victorinox Fibrox for $35 outperforms most $200 knife sets. Keep it sharp — a honing steel before each use and a proper sharpening every few months. A sharp knife is actually safer than a dull one because it goes where you direct it instead of slipping. Practice your dicing on onions: if you can dice an onion quickly and uniformly, you can handle anything.",
      "Under-seasoning is the number one reason home cooking tastes 'meh' compared to restaurant food. Restaurants use way more salt than you think — not to make food salty, but to make food taste like itself. A tomato with proper salt tastes more like a tomato, not like salt. Season in layers: salt your pasta water, salt while sautéing, and adjust at the end.\n\nBeyond salt, acid is the most transformative seasoning tool. If a dish tastes flat, it usually needs acid, not more salt. A squeeze of lemon, a splash of vinegar, or a spoonful of yogurt can lift an entire dish. Fat carries flavor (that's why butter makes everything better), and heat from chili flakes or black pepper adds dimension. Learn to taste your food at every stage and ask: does this need salt, acid, fat, or heat? That question is the entire foundation of intuitive seasoning.",
      "Mise en place — French for 'everything in its place' — means prepping and organizing all your ingredients before you start cooking. It seems fussy but it's the single most impactful habit you can adopt. When everything is chopped, measured, and within arm's reach, cooking becomes calm and rhythmic instead of chaotic and stressful.\n\nRead the entire recipe first. Then prep every ingredient and put them in small bowls or on a sheet tray in the order you'll use them. This prevents the panic of trying to mince garlic while your onions are burning. It also helps you catch missing ingredients before you're mid-recipe. Professional kitchens run on mise en place — no chef starts cooking without it. Once you adopt this habit, you'll wonder how you ever cooked without it. The cleanup feels like more work upfront, but it actually reduces total cleanup time because you're not scrambling with dirty hands mid-cook.",
      "The five French mother sauces — béchamel, velouté, espagnole, hollandaise, and tomato — are the foundation of Western cooking. Learn béchamel first: it's just butter, flour, and milk, but it becomes mac and cheese, lasagna, croque monsieur, and cream soups. A roux (butter + flour cooked together) is the base of three of the five sauces.\n\nOnce you can make a roux confidently, you can make béchamel (roux + milk), velouté (roux + stock), and espagnole (roux + brown stock + tomato). Hollandaise (egg yolks + butter + lemon) is the trickiest but becomes eggs Benedict and béarnaise. Tomato sauce is arguably the most useful: olive oil, garlic, canned San Marzano tomatoes, and basil. Twenty minutes, and it's better than any jar. These sauces are building blocks — once you know them, you can improvise hundreds of dishes without a recipe.",
      "Meal prep doesn't have to mean eating the same sad chicken and rice for five days. The secret is prepping components, not complete meals. Cook a big batch of grains (rice, quinoa, farro). Roast two sheet pans of mixed vegetables. Prepare two different proteins with different seasonings. Make two sauces or dressings.\n\nThen mix and match throughout the week: Monday is rice bowl with roasted vegetables and teriyaki chicken. Tuesday is quinoa salad with different vegetables and lemon-herb dressing. Wednesday is farro with the other protein and a different sauce. Same base ingredients, completely different meals. Also, prep things that improve with time: soups, stews, and marinated salads taste better on day two. And invest in good containers — glass over plastic, different sizes, and make sure they seal properly. Bad containers are the number one reason people give up on meal prep.",
    ],
  },
  Travel: {
    titles: [
      "How to pack light for any trip",
      "Finding cheap flights: what actually works",
      "The hostel experience everyone should have once",
      "How to eat well abroad on a budget",
      "Travel insurance: when it's worth it",
      "The art of slow travel",
      "Solo travel changed my life",
      "How to avoid tourist traps",
      "Learning basic local phrases matters",
      "The best travel credit cards and why",
      "How to handle jet lag effectively",
      "Street food safety: a practical guide",
      "How to travel with a partner without fighting",
      "The packing list I've refined over 50 trips",
      "Shoulder season is the best kept secret",
      "How to photograph your travels authentically",
      "Train travel in Europe: the complete guide",
      "How to negotiate prices respectfully",
      "The travel apps that actually save money",
      "Coming home: dealing with post-travel blues",
    ],
    contents: [
      "I traveled for three weeks through Southeast Asia with a 30-liter backpack. The secret: bring half of what you think you need and twice the money. You can buy almost anything you forget at your destination, usually cheaper. Roll your clothes instead of folding — it saves space and reduces wrinkles.\n\nMy packing rule: three bottoms, five tops, one nice outfit, one light jacket, and clothing that can be layered and mixed. Dark colors hide stains and look dressier. Quick-dry fabrics mean you can wash in a sink and wear the next day. The items people over-pack: shoes (you need two pairs max — walking shoes and sandals), toiletries (travel sizes last longer than you think), and 'just in case' items that never leave the bag. Every ounce you carry is a tax on your enjoyment.",
      "Google Flights is the single best flight search tool. Set up price alerts for your routes and watch for drops. The 'explore' feature shows cheapest destinations from your airport on a map. For the best prices: book domestic flights 1-3 months in advance, international 2-5 months. Tuesday and Wednesday departures are consistently cheapest.\n\nBeyond Google Flights: Skiplagged finds hidden-city fares (book to a further destination where your layover is your actual destination). Scott's Cheap Flights sends deals to your inbox. Being flexible with dates saves more than any hack — a Wednesday to Wednesday trip can cost half as much as a Saturday to Saturday. And credit card points are the ultimate game: one signup bonus on a travel card can fund an entire flight. The points game has a learning curve, but the payoff is massive.",
      "I was terrified of hostels before my first one. I pictured bedbugs and stolen wallets. The reality? It was one of the best social experiences of my life. Modern hostels range from basic dorms to design-forward spaces with private rooms, bars, and organized events. The social aspect is unmatched — you meet people from everywhere, and solo travelers become instant friend groups.\n\nTips for hostel success: bring earplugs and an eye mask (non-negotiable). Use a padlock for your locker. Book a smaller dorm (4-6 beds) over a large one. Read reviews on Hostelworld and filter for cleanliness ratings. The common areas are where friendships happen — don't just retreat to your bunk. And if you're over 30 and think you're 'too old' for hostels, many now have 'flashpacker' rooms or quiet floors for exactly that demographic. The connections you make over a hostel breakfast table are worth more than the fanciest hotel.",
      "Street food is how locals eat, and it's almost always the best food in any country. The fear of getting sick keeps many travelers away, but smart choices minimize risk significantly. Rule one: eat where there's a line of locals. High turnover means fresh food. Rule two: watch the food being cooked in front of you — hot and freshly prepared is safe.\n\nAvoid raw vegetables washed in local water, ice in drinks (unless you're in a developed country), and any meat that's been sitting at room temperature. But don't let fear control you — I've eaten street food across 30 countries and gotten sick maybe twice, both times from 'safe' hotel restaurants. Bangkok's street pad thai, Mexico City's al pastor tacos, Istanbul's balık ekmek, Hanoi's pho from a sidewalk stall — these are the meals that define your trip. Bring Imodium and activated charcoal just in case, and enjoy.",
      "Slow travel means spending more time in fewer places. Instead of seven countries in two weeks, try one country in two weeks. Instead of checking off landmarks, spend a morning in a local café. Rent an apartment instead of a hotel. Shop at the market and cook a meal. Walk without a destination.\n\nThe benefits are profound: you actually get to know a place instead of photographing it. You have conversations with locals instead of just transactions. You find the hidden spots that no guidebook lists because you had time to wander. It's also dramatically cheaper — moving between cities is expensive, and weekly apartment rentals are a fraction of nightly hotel rates. My most memorable travel experiences weren't at famous monuments. They were sitting in a square in Lisbon watching the world go by, or getting lost in a Tokyo neighborhood and finding a tiny ramen shop with four seats and an elderly chef who'd been there for 40 years.",
    ],
  },
  Startup: {
    titles: [
      "The idea doesn't matter as much as execution",
      "How to validate before you build",
      "The co-founder relationship is a marriage",
      "When to bootstrap vs. raise funding",
      "The MVP should embarrass you",
      "How to hire your first employee",
      "Burn rate will kill you before competition does",
      "The pitch deck that actually raised money",
      "How to handle rejection from investors",
      "Customer discovery interviews changed everything",
      "The legal basics every founder must know",
      "How to price your product",
      "Building culture from day one",
      "The pivot that saved our company",
      "How to manage your mental health as a founder",
      "Marketing on zero budget",
      "How to know when to quit",
      "Remote-first startups can work",
      "The advisor equity question",
      "Revenue solves most problems",
    ],
    contents: [
      "I've seen brilliant ideas executed poorly fail and mediocre ideas executed brilliantly succeed. The idea is maybe 10% of the outcome. The rest is execution: how fast you move, how well you listen to customers, how you adapt when reality doesn't match your plan. Every successful founder I know has pivoted at least once from their original idea.\n\nThe implication: don't be precious about your idea. Don't spend months in stealth mode perfecting something nobody's asked for. Get something in front of users immediately and let their feedback shape the product. The founders who fail are usually the ones who fell in love with their solution instead of the problem. Fall in love with the problem. Solutions are replaceable; deep understanding of a real problem is the moat.",
      "Before writing a single line of code, talk to 50 potential customers. Not friends, not family — actual people who might pay for your solution. Ask them about the problem you're solving: how do they currently handle it? What have they tried? What would they pay for a better solution? Listen more than you talk.\n\nThe Mom Test by Rob Fitzpatrick is the bible here: don't ask leading questions or pitch your idea. Ask about their life and their problems. If you describe the problem and they shrug, that's data. If they lean forward and start telling you stories about how much it frustrates them, you might be onto something. The validation isn't 'would you use this?' (everyone says yes to be polite). The validation is: have they already spent time, money, or effort trying to solve this problem on their own?",
      "My first co-founder relationship ended badly and nearly killed the company. What I've learned since: the co-founder relationship is more important than the idea, the market, or the timing. You'll spend more time with this person than your spouse. You'll disagree on everything from product direction to hiring to how much to spend on office snacks.\n\nBefore committing, work together on a small project for a month. See how you handle disagreement, stress, and ambiguity. Discuss: what happens if one person wants out? Who makes final decisions in which areas? What are your personal financial needs and runway? Put everything in a founders' agreement — vesting schedules (4-year vest with 1-year cliff is standard), equity split rationale, and departure terms. Having these conversations when you like each other is much easier than having them when you don't.",
      "Bootstrap if your business can generate revenue quickly. Raise funding if you need to move fast in a winner-take-all market or if the product requires significant upfront investment before it can earn. Most businesses should bootstrap. Raising money means selling part of your company, adding bosses (investors), and committing to a growth trajectory that may not suit your business.\n\nThe allure of fundraising is intoxicating — the validation, the press, the big numbers. But funded companies have a higher failure rate than bootstrapped ones. Every dollar of funding comes with expectations of 10x+ returns. That pressure warps decision-making. If you can get to $10K/month in revenue through sales and sweat, you have options: you can stay bootstrapped, you can raise on much better terms, or you can grow at your own pace. Revenue is the best funding round.",
      "Your MVP should be the smallest possible thing that tests your core assumption. Not a polished product, not a feature-rich platform — the minimum viable product. If your assumption is 'people will pay for curated restaurant recommendations,' your MVP is a spreadsheet you email to 20 people, not an app.\n\nShip it even if you're embarrassed. Reid Hoffman's quote is overused but true: 'If you're not embarrassed by the first version, you launched too late.' Our first product was a Google Form connected to a Zapier automation connected to a spreadsheet. It was ugly, manual, and duct-taped together. But 15 people used it and 3 offered to pay. That signal was worth more than 6 months of building a beautiful product nobody wanted. Speed of learning beats quality of product in the early days, every time.",
    ],
  },
  "Pet Owner": {
    titles: [
      "The first vet visit sets the tone for everything",
      "How to choose the right food for your pet",
      "Crate training done right",
      "The real cost of pet ownership",
      "How to introduce a new pet to your home",
      "Separation anxiety: understanding and managing it",
      "The importance of pet insurance",
      "Socialization windows are critical",
      "How to find a trustworthy pet sitter",
      "Reading your pet's body language",
      "The walk routine that improved everything",
      "Dental care for pets is seriously underrated",
      "How to handle behavioral issues early",
      "Choosing between adoption and breeder",
      "Multi-pet household harmony",
      "End-of-life decisions: preparing emotionally",
      "Travel with pets: what works and what doesn't",
      "The training method debate: positive reinforcement wins",
      "Seasonal hazards every pet owner should know",
      "How to pet-proof your home properly",
    ],
    contents: [
      "Your first vet visit establishes the relationship that will guide your pet's entire life. Choose a vet before you bring your pet home. Ask for recommendations from other pet owners, read reviews, and visit the clinic. A good vet communicates clearly, doesn't rush you, and answers questions without condescension.\n\nAt the first visit, bring any records from the shelter or breeder. Ask about vaccination schedules, parasite prevention, spay/neuter timing, and breed-specific health concerns. Don't be afraid to ask about costs upfront — a good vet will be transparent about pricing. Establish a relationship early so that when emergencies happen (and they will), you have someone you trust who knows your pet's history.",
      "The pet food industry is confusing by design. Here's what actually matters: look for foods where a named protein is the first ingredient (chicken, not 'poultry meal'). The AAFCO statement on the label tells you if the food is nutritionally complete. Beyond that, your pet's body is the best indicator — a shiny coat, solid stools, healthy weight, and good energy mean the food is working.\n\nDon't fall for marketing buzzwords like 'holistic,' 'human-grade,' or 'ancestral.' These are unregulated terms. Grain-free diets have been linked to heart disease in dogs (DCM), so avoid them unless your vet specifically recommends it for allergies. The most expensive food isn't necessarily the best. Talk to your vet about recommendations for your specific breed, age, and health status. And transition foods slowly over 7-10 days by mixing increasing amounts of new food with old to avoid digestive upset.",
      "Crate training, done correctly, gives your pet a safe den — not a punishment. The crate should be just big enough to stand, turn around, and lie down in. Make it cozy with blankets and a toy. Never use the crate as punishment. Start with the door open, treats inside, and let them explore at their own pace.\n\nBegin with 5-minute sessions with the door closed, gradually increasing time. Always let them out before they start whining — you want to reward calm behavior, not teach them that whining opens the door. Feed meals in the crate to create positive associations. Most puppies can be fully crate trained in 2-3 weeks. The crate becomes their retreat — many dogs voluntarily go to their crate when stressed or tired. It also makes housetraining dramatically easier because dogs instinctively avoid soiling their sleeping area.",
      "Before getting a pet, add up the real costs. A dog costs $1,500-$3,000 per year minimum: food ($500-1,000), vet visits ($300-600), preventatives ($200-400), grooming ($0-600 depending on breed), and miscellaneous (toys, beds, treats, damages). Cats are slightly cheaper but still $1,000-2,000/year. And that's without emergencies.\n\nAn emergency vet visit can easily cost $2,000-5,000. ACL surgery: $3,000-6,000. Cancer treatment: $5,000-20,000. This is why pet insurance matters — get it when your pet is young and healthy. Also budget for the hidden costs: pet deposits on apartments ($200-500), boarding or pet sitting when you travel ($30-75/day), and the stuff they destroy (our puppy ate two pairs of shoes and a couch cushion in his first month). Pets are worth every penny, but go in with eyes open about the financial commitment.",
      "When bringing a new pet home, the first 3 days are decompression, the first 3 weeks are learning the routine, and the first 3 months are when their true personality emerges. This 3-3-3 rule applies especially to rescue animals. Don't expect a scared shelter dog to be playful and cuddly on day one.\n\nSet up a quiet space for them with food, water, bed, and minimal stimulation. Let them explore at their own pace. Resist the urge to invite everyone over to meet the new pet — that's overwhelming. Establish the routine immediately: same feeding times, same walk times, same sleep spot. Dogs especially thrive on predictability. If you have existing pets, introduce them slowly on neutral territory, and always supervise initial interactions. Expect some bumps — it takes 2-4 weeks for most pets to settle into a new home's rhythm.",
    ],
  },
  Teacher: {
    titles: [
      "Classroom management that actually works",
      "How to handle helicopter parents",
      "The grading system I wish I started with",
      "Building relationships with difficult students",
      "Surviving your first year of teaching",
      "How to differentiate instruction effectively",
      "The lesson planning approach that saves time",
      "Dealing with administration politics",
      "Self-care for teachers is not optional",
      "Technology in the classroom: what works",
      "How to make boring subjects engaging",
      "The parent conference strategy",
      "Managing a classroom budget on nothing",
      "Co-teaching partnerships that work",
      "How to handle behavioral escalations safely",
      "The summer reset for your sanity",
      "Transitioning between grade levels",
      "Building a professional learning network",
      "How to advocate for your students effectively",
      "The decision to leave teaching vs. stay",
    ],
    contents: [
      "Classroom management isn't about control — it's about creating an environment where learning is possible. The foundation is relationships. Students won't respect arbitrary rules from someone they don't trust. Spend the first two weeks of school building connections: learn every name by day three, learn one interest per student by week two.\n\nThen establish 3-5 clear expectations (not rules). 'Rules' invite defiance; 'expectations' invite growth. Post them, practice them, reference them constantly. When a student violates an expectation, address it privately, not publicly. 'Hey Marcus, I noticed you were talking during the lesson. I know you've got a lot to say — can we find a better time for that?' This approach preserves dignity and builds relationship while still addressing the behavior. The teachers who struggle most with management are the ones who try to use power instead of connection.",
      "Helicopter parents come from a place of anxiety, not malice. Understanding that changes how you respond. When a parent emails demanding to know why their child got a B+, don't get defensive. Respond with: 'I appreciate your involvement in Jordan's education. Here's exactly what Jordan can do to move toward that A, and here's how we can support that together.'\n\nSet communication boundaries early: respond to emails within 24-48 hours, but not at 10 PM. Let parents know your office hours and preferred contact method at the start of the year. Document everything — every conversation, every email, every phone call. When parents escalate, having a paper trail protects you. And when a parent is truly unreasonable, involve administration early. It's not weakness to bring in support; it's professionalism.",
      "I used to spend 15+ hours a week grading. Now I spend 3. The shift: not everything needs to be graded, and not everything graded needs detailed feedback. Homework? Completion grade. Quick check for understanding? Self-grade or peer-grade in class. Only major assessments get detailed teacher feedback.\n\nFor those major assessments, use rubrics with clear criteria shared before the assignment. Students should never be surprised by what's being evaluated. I also use single-point rubrics (one column describing proficient performance) instead of multi-point rubrics. They're faster to create and easier for students to understand. For written work, I give feedback on one focus area per assignment — not every possible issue. This week it's thesis statements. Next assignment it's evidence integration. Targeted feedback is more actionable than comprehensive feedback that overwhelms.",
      "The students who push you away the hardest are the ones who need connection the most. The kid who disrupts every class, rolls their eyes, and seems to hate you? There's almost always something underneath — trauma, instability at home, a learning difference, or years of feeling like a failure in school.\n\nMy approach: find their thing. Every student has something they care about. Video games, a sport, a sibling, a pet, music. Find it and use it. 'Hey David, I heard you're into Minecraft. My nephew is obsessed — what's the appeal?' That 30-second conversation costs you nothing and deposits into a relationship bank account you'll need later when you ask David to put his phone away. The relationship is the intervention. Once a difficult student believes you genuinely care about them as a person — not just their behavior — everything changes.",
      "Your first year of teaching will be the hardest professional year of your life. Accept that now and let go of perfection. You will have lessons that bomb. You will cry in your car at least once. You will question your career choice. Every teacher who's been at it for 10+ years will tell you the same thing: the first year is survival, not excellence.\n\nSurvival strategies: find one mentor teacher and shadow them, steal their materials, ask them everything. Don't reinvent the wheel — use curriculum resources, adapt other teachers' lesson plans, and join online communities like #MTBoS (math), #engchat (ELA), or r/Teachers. Go to bed at a reasonable hour even if papers aren't graded. Exercise even if you're exhausted. And keep a 'wins' folder — every thank you note, every breakthrough moment, every time a kid got it. On the bad days (and there will be many), that folder is your lifeline.",
    ],
  },
  NYC: {
    titles: [
      "The first apartment search: what nobody tells you",
      "Subway survival guide for newcomers",
      "How to actually save money living in NYC",
      "The neighborhood guide beyond Manhattan",
      "Making friends in the loneliest crowded city",
      "Best free things to do in New York",
      "How to navigate the restaurant scene",
      "The bodega is your best friend",
      "Central Park secrets most tourists miss",
      "How to handle the pace without burning out",
      "Brooklyn vs. Manhattan: the honest comparison",
      "NYC dating culture is its own beast",
      "The farmers markets worth waking up for",
      "How to get theater tickets on a budget",
      "Moving to NYC with pets",
      "The winter survival kit for New Yorkers",
      "How to tip in New York (it's more than you think)",
      "Getting a doctor in NYC takes strategy",
      "The commute calculation that matters most",
      "When NYC breaks you (and how to recover)",
    ],
    contents: [
      "NYC apartment hunting is a blood sport. Expect to pay a broker fee (often 15% of annual rent), first month's rent, last month's rent, and a security deposit — that's potentially $10,000+ upfront for a $2,500/month apartment. Have all your documents ready: pay stubs, tax returns, bank statements, references, and a guarantor if your income is under 40x monthly rent.\n\nSee apartments in person — photos lie. Check water pressure, open every cabinet (look for roaches), test the stove and outlets. Visit at different times of day: that quiet street might be a bar strip at midnight. Consider outer boroughs seriously: Astoria, Washington Heights, Park Slope, and Bushwick all have great communities at lower prices. And be ready to decide on the spot — good apartments go in hours, not days. Have your checkbook ready when you walk in.",
      "The subway is the circulatory system of the city. Download the MYmta app and get a MetroCard (or set up OMNY on your phone). Learn your lines: the 1/2/3 are West Side, 4/5/6 are East Side, the L is the crosstown hipster express, and the G is the eternal punchline that sometimes actually shows up.\n\nPro tips: express trains skip stations — check before you hop on. The middle of the platform is usually less crowded. If a car is empty during rush hour, there's a reason (smell, broken AC, or worse) — keep walking. Never hold the doors. Peak rudeness is blocking the doors while people are trying to exit. Stand to the right on escalators. And download a map — cell service is spotty underground. The subway runs 24/7, but late-night service is slower and sometimes rerouted. Citibike is often faster than the subway for short trips, especially crosstown.",
      "Everyone says you can't save money in NYC. That's only true if you live like NYC wants you to. The city is designed to extract every dollar through convenience, dining, and entertainment. Fighting that extraction requires intentionality.\n\nCook at home. This is the biggest lever. NYC dining adds up terrifyingly fast — $15 lunches and $60 dinners multiply into thousands monthly. Trader Joe's and Aldi are your friends. Use happy hours instead of dinner dates. Walk instead of taking cabs. Free entertainment is everywhere: free museum hours, free outdoor concerts, free comedy shows (just buy one drink minimum). Get a library card — NYPL has free museum passes, free events, and free coworking space. And the most NYC money hack: leave the city on weekends. A $30 MetroNorth ticket to the Hudson Valley is cheaper than one Saturday night in Manhattan.",
      "Manhattan is not New York. The real city lives in the boroughs. Astoria, Queens has the best Greek and Egyptian food in America. Jackson Heights is the most diverse neighborhood in the world — Tibetan momos, Colombian arepas, and Indian chaat on the same block. Sunset Park's Chinatown rivals Flushing.\n\nBrooklyn is its own universe: DUMBO for waterfront views, Williamsburg for the scene (yes, it's still fun despite the haters), Crown Heights for Caribbean food and culture, Bay Ridge for old-school NYC charm. The Bronx has Arthur Avenue (better Italian than Little Italy), the real Yankee Stadium experience, and the Botanical Garden. Staten Island has the free ferry with the best skyline view. The biggest mistake newcomers make is never leaving their Manhattan/Brooklyn bubble. The diversity of food, culture, and experience in the outer boroughs is what makes NYC genuinely unlike anywhere else on Earth.",
      "NYC can be profoundly lonely. You're surrounded by 8 million people and can go weeks without a meaningful conversation. The city rewards initiative — friendships don't happen passively here like they might in smaller cities or college.\n\nWhat works: join a recurring group activity. A running club, a book club, a volunteer shift, a rec league. The key is 'recurring' — you need to see the same people repeatedly. One-off events don't build friendships. Apps like Meetup and Eventbrite have thousands of options. Say yes to everything for the first three months — even things that sound boring. Some of my closest NYC friendships came from events I almost skipped. And befriend your neighbors. In a city this transient, the people in your building are your closest community. Bring cookies to the floor when you move in. It sounds corny, but it works.",
    ],
  },
  Freelancer: {
    titles: [
      "How to set your rates without undervaluing yourself",
      "The contract that saved me from a nightmare client",
      "Managing feast and famine cycles",
      "How to fire a bad client professionally",
      "The tax strategy every freelancer needs",
      "Building a client pipeline that never runs dry",
      "How to scope projects to avoid scope creep",
      "The proposal template that wins work",
      "Health insurance as a freelancer",
      "Setting boundaries when you work from home",
      "How to handle late-paying clients",
      "The portfolio that gets you hired",
      "Transitioning from employment to freelance",
      "Networking without being sleazy",
      "How to raise your rates with existing clients",
      "The tools that run my freelance business",
      "Finding your niche vs. staying a generalist",
      "How to negotiate project terms",
      "Building recurring revenue as a freelancer",
      "When to say no to a project",
    ],
    contents: [
      "Most freelancers undercharge because they're pricing based on what they used to earn as an employee divided by hours. That math ignores: self-employment tax (15.3%), health insurance, retirement savings, unpaid vacation, equipment, software, and the hours you spend on business development, invoicing, and admin. Your freelance rate should be roughly 2-3x what your hourly rate was as an employee.\n\nTo set your rate: calculate your annual expenses (personal + business), add your desired profit margin, divide by billable hours (not total hours — realistically you'll bill 60-70% of your working time). That's your minimum. Then research market rates for your skill set and experience level. If you're below market, raise your rates. The clients you lose by charging more are usually the clients you don't want anyway. Premium rates attract premium clients who value quality and pay on time.",
      "I once did $15,000 of work without a contract because the client was 'a friend.' They disputed half the deliverables, delayed payment for months, and the friendship ended anyway. Now, no contract = no work. Period.\n\nYour contract needs: scope of work (detailed, specific deliverables), timeline with milestones, payment terms (50% upfront is standard), revision limits (2 rounds included, additional rounds billed hourly), kill fee (if they cancel mid-project, they owe for work completed plus a percentage), intellectual property transfer (only upon full payment), and a late payment clause (1.5% monthly interest on overdue invoices). Get a lawyer to review your template once — it's a $500-1,000 investment that will save you tens of thousands. And always, always get deposits before starting work. A client who won't pay 50% upfront won't pay 100% on completion.",
      "The feast-and-famine cycle destroys freelancers. You get busy, stop marketing, finish the projects, and suddenly have no pipeline. The solution is counterintuitive: you must market even when you're fully booked. Especially when you're fully booked.\n\nDedicate 20% of your time to business development regardless of how busy you are. That means: maintaining your portfolio, posting on social media, reaching out to past clients, attending industry events, and writing thought leadership content. When you're at capacity, you can be selective about new clients — which actually makes you more attractive. 'I'm booked through next month but could start in March' is more compelling than 'I'm available immediately.' Also, build relationships with other freelancers in your field. When you're overbooked, refer work to them. When they're overbooked, they refer to you. This mutual referral network is the most reliable pipeline I've ever built.",
      "Firing a client feels terrifying, but keeping a toxic client costs more than losing them. The signs: constant scope creep, disrespecting your time, paying late repeatedly, excessive revisions, or making you dread opening your email. Calculate what they actually cost you per hour including the stress and admin overhead — toxic clients are almost always your least profitable.\n\nHow to do it professionally: 'I've really enjoyed working together, but I'm restructuring my business to focus on [niche/direction]. I'll need to wrap up our engagement by [date]. I'm happy to help transition to another provider and will ensure all current deliverables are completed.' Give adequate notice (2-4 weeks minimum). Don't burn bridges — they might become a good client for someone else, and your referral builds goodwill. And don't feel guilty. The energy you free up by dropping one bad client can serve two good ones.",
      "Freelancer taxes are a rude awakening if you're not prepared. You owe roughly 30-40% of your income in taxes: federal income tax plus 15.3% self-employment tax. If you don't set this aside, you'll get crushed at tax time.\n\nOpen a separate savings account and transfer 30% of every payment into it immediately. Pay quarterly estimated taxes to avoid penalties (due April 15, June 15, September 15, January 15). Deduct everything legitimate: home office (dedicated space), internet, phone, software, equipment, professional development, health insurance premiums, and mileage. Track expenses as they happen using an app like Wave or FreshBooks. Consider forming an S-Corp once you're consistently earning over $80-100K — it can save you thousands in self-employment tax. And get an accountant who specializes in self-employment. The money they save you will far exceed their fee.",
    ],
  },
  Introvert: {
    titles: [
      "How to thrive in an extrovert's world",
      "Setting boundaries without guilt",
      "The social battery is real: managing it wisely",
      "Networking strategies for introverts",
      "How to handle open office plans",
      "Finding friends who understand your energy",
      "The power of one-on-one conversations",
      "Introversion is not social anxiety",
      "How to decline invitations gracefully",
      "Creating a recharge routine that works",
      "Introverts in leadership roles",
      "How to survive mandatory social events",
      "Dating as an introvert",
      "The alone time that makes you better",
      "How to speak up in meetings",
      "Introvert-friendly careers that pay well",
      "Travel tips for introverts",
      "How to handle family gatherings",
      "The misconceptions that frustrate me most",
      "Finding your social sweet spot",
    ],
    contents: [
      "Being an introvert in an extroverted world doesn't mean you need to become extroverted. It means learning to work with your wiring, not against it. The key insight: introversion isn't about being shy or antisocial. It's about where you get energy. Extroverts recharge around people; introverts recharge alone. Both are valid.\n\nThe strategies that transformed my life: scheduling alone time like appointments (it's not negotiable). Arriving at social events early when it's less overwhelming and leaving when my battery hits 20%. Choosing quality connections over quantity — I maintain five close friendships rather than fifty acquaintances. And being honest about my needs: 'I'd love to join for dinner, but I'll probably head out around 9.' People respect honesty way more than excuses or last-minute cancellations.",
      "Boundaries are not selfish — they're the infrastructure that makes your generosity sustainable. Without boundaries, introverts burn out, resent the people they love, and eventually withdraw completely. With boundaries, we can show up fully for the social interactions we choose.\n\nPractical boundaries: don't answer calls without notice (texts first). Keep weeknight plans to two per week maximum. Have a standing 'home night' that's non-negotiable. When someone invites you to something, don't answer immediately — say 'Let me check my schedule and get back to you.' This gives you time to honestly assess your energy level instead of people-pleasing in the moment. And the most powerful boundary: 'I need to recharge tonight.' No explanation required. People who need a reason for your boundary are people who plan to argue with your reason.",
      "Think of your social energy as a literal battery. Different activities drain it at different rates: large groups drain fast, one-on-one conversations drain slowly, and some conversations actually charge you. Once I started tracking what drained and what charged my social battery, I could plan my week strategically.\n\nMonday: fully charged from a quiet weekend. Schedule the team meeting and the client call. Tuesday: still okay, do a lunch with a friend. Wednesday: getting low, protect the evening. Thursday: recharge night, no plans. Friday: recharged enough for a small social gathering. The key is not letting your battery hit zero — recovery from complete depletion takes days, not hours. And communicate with your partner or close friends: 'My battery is at 30%, I need a quiet evening' is much better than silently resenting their desire to socialize.",
      "Traditional networking events are an introvert's nightmare: loud rooms, small talk with strangers, forced enthusiasm. But networking is essential for career growth. The solution: network in introvert-friendly ways.\n\nOne-on-one coffee meetings are gold. Ask someone you admire for 20 minutes over coffee. Most people say yes, and the focused conversation plays to your strengths. Online networking counts: thoughtful LinkedIn comments, contributing to industry forums, writing articles that demonstrate expertise. When you must attend events, set a goal of three meaningful conversations (not thirty surface ones). Ask good questions — introverts are excellent listeners, and people love talking to someone who genuinely listens. And give yourself permission to leave after an hour. The quality of your connections matters infinitely more than the hours logged.",
      "Introversion and social anxiety are frequently confused, but they're completely different. Introversion is a preference — I prefer quieter, less stimulating environments. Social anxiety is a fear — I'm afraid of social judgment and it causes distress. Introverts can be completely comfortable socially; they just need recovery time afterward.\n\nThis distinction matters because the solutions are different. If you're an introvert, you need energy management strategies. If you have social anxiety, you may benefit from therapy (CBT is highly effective for social anxiety). Many people have both — I'm introverted AND had social anxiety. Treating the anxiety through therapy didn't make me extroverted, but it removed the fear layer. Now I can enjoy social situations on my own terms rather than avoiding them out of dread. If social situations cause you genuine fear or physical symptoms (racing heart, nausea, avoidance behavior), that's worth exploring with a professional.",
    ],
  },
  Marriage: {
    titles: [
      "The conversation to have before getting engaged",
      "How to keep dating your spouse",
      "Financial transparency is non-negotiable",
      "The in-law boundaries that saved us",
      "Fighting fair in marriage",
      "How to survive the first year of marriage",
      "Maintaining individual identity within marriage",
      "The division of labor that actually works",
      "When to seek couples therapy (earlier than you think)",
      "How to handle different love languages",
      "The sex conversation nobody wants to have",
      "Marriage after kids: keeping the connection",
      "How to support a struggling spouse",
      "The small daily rituals that matter most",
      "Growing apart vs. growing together",
      "How to handle money disagreements",
      "The apology that actually heals",
      "Second marriages: lessons from the first",
      "Long-term marriage myths debunked",
      "How to reconnect after drifting apart",
    ],
    contents: [
      "Before you get engaged, have these conversations: Do you want children? If yes, how many and when? How will we handle finances — joint accounts, separate, hybrid? What role will religion play in our family? Where do we want to live long-term? How do we handle conflict? What are your non-negotiables? What does retirement look like to you?\n\nThese conversations aren't romantic, but they prevent the most common marriage conflicts. Don't assume you're aligned just because you're in love. I've seen couples divorce over issues they never discussed: one wanted kids, the other didn't. One expected to move back to their hometown, the other didn't know that was the plan. Love doesn't conquer incompatibility on foundational life decisions. Have these conversations sober, face to face, and more than once — people's answers evolve.",
      "The couples who stay happy long-term never stop dating. I don't mean expensive dinners — I mean intentional time focused on each other. Weekly date nights are the minimum viable marriage maintenance. It can be a walk, cooking together, or sitting on the porch without phones.\n\nThe Gottman research shows that lasting couples make 'bids' for connection and their partner responds positively. A bid is anything from 'look at this sunset' to 'I had a hard day.' Turning toward your partner's bids (engaging) instead of away (ignoring) or against (dismissing) is the single strongest predictor of marriage success. It's not grand romantic gestures that sustain a marriage — it's the daily micro-moments of attention, interest, and response. Notice your partner. Ask about their day and listen to the answer. Touch them in passing. These tiny deposits compound into a marriage that feels secure and connected.",
      "Money is the number one thing couples fight about, and it's almost never about the money itself — it's about values, security, and control. The solution starts with radical transparency: both partners should know the complete financial picture. Every account, every debt, every investment.\n\nWe use a hybrid system: one joint account for household expenses (mortgage, utilities, groceries, kids), individual accounts for personal spending, and a joint savings for goals. We have a monthly money meeting — 15 minutes to review spending, adjust the budget, and discuss upcoming expenses. Any purchase over $200 gets discussed first. This isn't about permission; it's about partnership. The meeting also eliminates the resentment that builds when one person feels the other is spending irresponsibly. Financial alignment doesn't mean identical financial philosophies — it means a system that respects both partners' needs and values.",
      "In-law conflict is the hidden marriage killer. The boundary that matters most: your spouse comes first. Always. When your mother criticizes your partner, your job is to stand with your partner, not mediate or stay neutral. 'Mom, I love you, but I need you to respect my wife. This isn't up for discussion.'\n\nSet boundaries as a united front. Decide together what's acceptable, then the person whose family it is communicates the boundary. Don't make your spouse the bad guy to your family. Practical boundaries we set: no unannounced visits. No unsolicited parenting advice. Holiday rotation that's fair to both families. A separate call/text between the child and grandparents that doesn't go through the spouse. These conversations are uncomfortable but they prevent years of accumulated resentment. And if your parent can't respect your boundaries, reduced contact is a valid consequence.",
      "We went to couples therapy when everything was 'fine' — and it was the smartest thing we ever did. We weren't in crisis. We just felt disconnected, like roommates managing a household instead of partners building a life. A therapist gave us tools we didn't know we needed.\n\nThe biggest insight: we had different attachment styles (I was anxious, she was avoidant) and we were triggering each other's worst patterns. Understanding this pattern alone reduced our conflict by 50%. We learned to state needs directly instead of hoping the other person would guess. We learned to fight about the actual issue instead of the proxy issue. If you're considering therapy, don't wait until you're in crisis. Prevention is easier than repair. And shop for a therapist who works — not every therapist fits every couple. The Gottman Method has the strongest evidence base, so look for a Gottman-trained therapist.",
    ],
  },
  Retirement: {
    titles: [
      "The financial number you actually need",
      "How to find purpose after your career ends",
      "Healthcare planning before Medicare kicks in",
      "The social life shift nobody prepares you for",
      "How to structure your days in retirement",
      "Downsizing: when and how to do it",
      "The emotional journey of leaving your identity behind",
      "Staying physically active after 60",
      "How to travel in retirement without blowing your savings",
      "Managing relationships when you're home all day",
      "The volunteer work that gives back the most",
      "Estate planning basics everyone needs",
      "How to handle boredom in retirement",
      "Part-time work that feels meaningful",
      "The technology skills that keep you connected",
      "How to protect yourself from financial scams",
      "Retirement communities: pros and cons",
      "Maintaining cognitive health actively",
      "How to talk to your kids about your finances",
      "The regrets retirees most commonly share",
    ],
    contents: [
      "The '4% rule' says you can withdraw 4% of your retirement savings annually without running out over a 30-year retirement. So if you need $60,000/year, you need $1.5 million saved. But this rule has caveats: it assumes a specific asset allocation, doesn't account for healthcare inflation, and was based on historical returns that may not repeat.\n\nA more practical approach: calculate your actual monthly expenses, subtract guaranteed income (Social Security, pensions), and the gap is what your savings need to cover. Don't forget healthcare (potentially $500-1,500/month before Medicare at 65), travel, home maintenance, and inflation. I recommend having 25-30x your annual gap saved. And run the numbers with a fee-only financial advisor — not one who earns commissions on products. The peace of mind from knowing your exact number is worth every penny of that advisory fee.",
      "The first six months of retirement feel like vacation. Then the existential crisis hits. Your identity was your career — 'I'm a teacher,' 'I'm an engineer' — and now you're... retired. The loss of structure, purpose, and social connection catches people off guard.\n\nThe happiest retirees I know replaced their career identity with purpose, not leisure. They volunteer, mentor, take classes, start passion projects, or work part-time in something they love. They have a morning routine. They have a calendar with commitments. Total freedom sounds amazing but it leads to depression for many people. My advice: before you retire, experiment. Take a sabbatical or long vacation and see how you handle unstructured time. Start building post-career activities while you're still working. And maintain your social connections — they don't survive on autopilot once you leave the office.",
      "If you retire before 65, healthcare is your biggest financial wildcard. COBRA from your employer lasts 18 months but is expensive (you pay the full premium plus 2%). ACA marketplace plans are the most common bridge — your subsidy depends on your income, so managing your taxable retirement withdrawals strategically can significantly reduce premiums.\n\nBudget $500-1,500 per person per month for healthcare before Medicare. That includes premiums, deductibles, copays, and prescriptions. Consider an HSA if you're eligible — triple tax advantage and it can carry over into retirement. Once you hit 65, Medicare isn't free or comprehensive: Part B premiums are $170+/month per person, and you'll want a Medigap or Medicare Advantage plan for the coverage gaps. Dental and vision are mostly not covered. Healthcare planning should be part of your retirement financial plan from age 40 onward, not an afterthought at 64.",
      "The biggest surprise of retirement wasn't financial — it was social. My work friends, who I saw daily for 30 years, faded within months. We'd promised to stay in touch, but without the shared daily experience, conversations became forced. This is normal, but it's still painful.\n\nRebuilding a social life in retirement requires intentional effort. Join groups based on interests: hiking clubs, book clubs, community organizations, volunteer teams. Take classes at community college — learning alongside others is bonding. If you're married, you and your spouse need separate social lives too. Being each other's only social outlet puts enormous pressure on the relationship. And maintain intergenerational friendships — spending time only with retirees creates an echo chamber of health complaints and nostalgia. The 30-year-old at your volunteer org will keep you current and energized.",
      "Structure isn't the enemy of retirement — it's the enabler of enjoyment. Without structure, days blur together and suddenly it's Thursday and you've accomplished nothing and feel worse than when you were working. The solution isn't scheduling every minute, but having an intentional framework.\n\nMy framework: mornings are for physical activity and personal projects. Afternoons are for social activities and errands. Evenings are for relaxation and hobbies. Within that framework, each day has flexibility. Monday I swim and work on my woodworking. Tuesday I volunteer at the food bank. Wednesday is my coffee meetup and a museum visit. This rhythm prevents both the aimless days and the over-scheduled ones. Also, give yourself permission for genuinely lazy days — just make them intentional ('Today I'm choosing to do nothing') rather than defaulting into them from lack of direction.",
    ],
  },
  Anxiety: {
    titles: [
      "The breathing technique that stops panic attacks",
      "How to tell the difference between anxiety and intuition",
      "Therapy types explained: which one worked for me",
      "The morning routine that reduces my baseline anxiety",
      "How to handle anxiety at work without anyone knowing",
      "Medication: my honest experience",
      "The physical symptoms I didn't know were anxiety",
      "How to support someone with anxiety",
      "Sleep and anxiety: breaking the cycle",
      "Social anxiety strategies that actually help",
      "The anxiety journal changed everything",
      "Exercise as anxiety treatment: what the research says",
      "How to manage health anxiety",
      "Cognitive distortions and how to catch them",
      "The gut-brain connection is real",
      "How to handle anxiety in relationships",
      "Grounding techniques for overwhelming moments",
      "When anxiety becomes a disorder",
      "The apps and tools that help me manage",
      "Acceptance vs. fighting anxiety",
    ],
    contents: [
      "When a panic attack hits, your breathing is the one thing you can control. The technique that works for me: breathe in for 4 counts through your nose, hold for 7 counts, breathe out through your mouth for 8 counts. This activates your parasympathetic nervous system — the body's natural brake pedal for the fight-or-flight response.\n\nDo this 4 times and the physiological panic response starts to subside. The key is making the exhale longer than the inhale. I practice this technique when I'm NOT panicking so it becomes automatic when I am. The first time you try 4-7-8 breathing during a panic attack, it feels impossible. But if you've practiced it 100 times when calm, your body remembers the pattern. I also pair it with a grounding technique: name 5 things I can see, 4 I can touch, 3 I can hear, 2 I can smell, 1 I can taste. Together, these pull me out of my head and back into my body.",
      "This was one of the hardest things to learn: anxiety disguises itself as intuition. Both feel like 'something is wrong.' The difference? Intuition is a quiet knowing that doesn't escalate. It's calm but clear. Anxiety is loud, urgent, and spirals — it generates increasingly catastrophic scenarios.\n\nAnother test: intuition usually relates to the present situation. Anxiety time-travels — it's about what might happen, what could go wrong, worst-case scenarios in a hypothetical future. Intuition says 'this person makes me uncomfortable' and stops there. Anxiety says 'this person makes me uncomfortable, they probably hate me, everyone here probably hates me, I'm going to get fired, I'll never find another job.' The spiral is the giveaway. Learning to distinguish these two has been transformative for my decision-making. I can honor my intuition while recognizing when anxiety is wearing intuition's costume.",
      "I tried three types of therapy before finding what worked. Talk therapy (psychodynamic) helped me understand my childhood roots but didn't reduce my daily symptoms. CBT (Cognitive Behavioral Therapy) was the first game-changer — it taught me to identify and challenge anxious thoughts. The thought 'I'm going to fail this presentation' became 'What's the evidence for and against that? What's the most realistic outcome?'\n\nBut the real breakthrough came with EMDR (Eye Movement Desensitization and Reprocessing) for processing specific traumatic memories that fueled my anxiety. The combination of CBT for daily management and EMDR for root-cause processing reduced my anxiety by about 70%. Not everyone needs EMDR — if your anxiety isn't trauma-based, CBT alone is highly effective. The point is: if one type of therapy isn't working, try another. Therapy isn't one-size-fits-all, and a good therapist will tell you when their approach isn't the right fit.",
      "Every morning, before checking my phone, I do: 10 minutes of meditation (Insight Timer app, free), 20 minutes of exercise (even just a walk), and a written brain dump where I list everything bouncing around my head. This routine takes 40 minutes and drops my baseline anxiety by half.\n\nThe phone rule is crucial. Checking email or social media first thing floods your brain with cortisol and puts you in reactive mode. My brain needs time to wake up gently before facing the world's demands. The exercise doesn't need to be intense — a 20-minute walk in daylight is enough. The daylight exposure helps set your circadian rhythm, which improves sleep, which reduces anxiety. And the brain dump prevents the rumination spiral. Once thoughts are on paper, my brain releases its grip on them. This routine is my non-negotiable foundation. Everything else in my anxiety toolkit is built on top of it.",
      "For years, I went to the ER thinking I was having a heart attack, only to be told it was anxiety. Chest tightness, heart palpitations, numbness in my hands, dizziness, nausea, difficulty swallowing — all anxiety. The physical symptoms are terrifying because they feel genuinely medical.\n\nOther physical symptoms people don't realize are anxiety: chronic muscle tension (especially jaw and shoulders), digestive issues (IBS is frequently anxiety-linked), frequent urination, headaches, fatigue despite adequate sleep, and restless legs. My jaw clenching was so bad I needed a night guard. My stomach issues led to a year of GI testing before anyone connected it to anxiety. If you have unexplained physical symptoms that worsen with stress and multiple doctors can't find a cause, consider anxiety as the explanation. It's not 'all in your head' — it's your nervous system stuck in fight-or-flight, and the body pays the price.",
    ],
  },
  Programmer: {
    titles: [
      "The debugging mindset that saves hours",
      "How to read other people's code effectively",
      "The importance of writing tests first",
      "Imposter syndrome is universal in tech",
      "How to learn a new language or framework fast",
      "Code review etiquette that builds teams",
      "The git workflow every developer should know",
      "How to estimate project timelines honestly",
      "Burnout in tech: recognizing and preventing it",
      "Clean code principles that actually matter",
      "How to negotiate your salary in tech",
      "The side project that launched my career",
      "Documentation nobody writes but everyone needs",
      "How to ask good questions on Stack Overflow",
      "Pair programming: love it or hate it",
      "The tech stack debate that doesn't matter",
      "Remote work as a developer: tools and habits",
      "How to mentor junior developers",
      "Technical debt: when to pay it down",
      "The soft skills that accelerate your career",
    ],
    contents: [
      "When a bug appears, resist the urge to start changing code randomly. Instead: reproduce it consistently. Can you make it happen every time? What are the exact steps? Once you can reproduce reliably, you've already solved half the problem.\n\nThen narrow the scope. Use binary search on your codebase: comment out half the code, does the bug persist? Yes → the bug is in the remaining half. No → it's in what you removed. Continue halving until you've isolated it. Read error messages carefully — they usually tell you exactly what's wrong, and developers habitually ignore them. Add logging at key points. Use a debugger to step through execution. And when you're truly stuck, explain the problem out loud to someone (or a rubber duck). The act of articulating the problem often reveals the solution.",
      "Reading unfamiliar code is a skill that improves with practice but requires a specific approach. Don't start at line 1 and read sequentially — that's like reading a dictionary to understand English. Start with the entry point: main(), the route handler, the top-level component. Then follow the execution path for one specific feature.\n\nUse the tests (if they exist) as documentation — they show expected inputs and outputs for each function. Read the README and any architecture docs first. Use your IDE's 'go to definition' and 'find all references' extensively. Draw a diagram of the major components and how they connect. And don't try to understand everything at once. Understand the feature you need to modify, then expand outward. I've worked on codebases with millions of lines. Nobody understands all of it. The skill is knowing how to find what you need quickly.",
      "Test-Driven Development (TDD) felt backward until it clicked. Write a failing test first. Then write the minimum code to make it pass. Then refactor. Red, green, refactor. The discipline is writing the test BEFORE the code.\n\nWhy it works: it forces you to think about the interface before the implementation. What does this function take? What should it return? What are the edge cases? Answering these questions before coding leads to cleaner, more focused code. It also gives you a safety net for refactoring — if your changes break something, you know immediately. The biggest objection is speed: 'Writing tests slows me down.' Short-term, yes. Long-term, TDD developers ship faster because they spend dramatically less time debugging and less time afraid to change existing code. Start with unit tests for pure functions, then expand to integration tests as the habit solidifies.",
      "Every programmer I respect has imposter syndrome. The field is so vast that you'll always meet someone who knows something you don't. The junior developer who just learned React feels like a fraud next to the senior. The senior feels like a fraud because they don't understand machine learning. The ML expert feels like a fraud because their frontend skills are lacking.\n\nThe truth: nobody knows everything. The best developers are comfortable saying 'I don't know, let me find out.' They're not the ones who memorize the most — they're the ones who learn fastest and communicate well. If you can break down a problem, find the relevant documentation, and implement a solution, you're a real programmer. The number of languages you know, your degree (or lack thereof), your years of experience — none of that determines your legitimacy. Building things that work determines your legitimacy.",
      "When learning a new language or framework, don't start with the documentation. Start with a project. Pick something small but complete — a todo app, a weather dashboard, a CLI tool. Then learn exactly what you need to build that project, as you need it.\n\nThis project-based approach gives you context for the concepts you're learning. 'Why do I need state management?' becomes obvious when your todo app's data is getting messy. 'What are hooks?' makes sense when you need to fetch data on component mount. After the first project, do a second one that's slightly more complex. Then read the documentation — it will make 10x more sense because you have practical context. Also, read other people's code in that language/framework. GitHub is full of example projects. Seeing how experienced developers structure their code teaches patterns that tutorials skip.",
    ],
  },
  Nurse: {
    titles: [
      "How to survive your first code blue",
      "The patient assessment shortcut that catches everything",
      "Managing 12-hour shifts without crashing",
      "How to deal with difficult physicians",
      "The documentation hack that saves an hour per shift",
      "Self-care strategies for healthcare workers",
      "How to advocate for your patient effectively",
      "The night shift survival guide",
      "Building relationships with patients' families",
      "When to trust your nursing instincts",
      "How to handle workplace bullying in nursing",
      "The continuing education that actually matters",
      "Transitioning between nursing specialties",
      "How to mentor new grad nurses",
      "The emotional toll of end-of-life care",
      "Time management for floor nurses",
      "How to prepare for certification exams",
      "The safety practices that save lives",
      "Managing multiple high-acuity patients",
      "Finding meaning in the chaos",
    ],
    contents: [
      "Your first code blue will feel like an out-of-body experience. Your training kicks in, but your brain is screaming. Here's what helped: practice the algorithms until they're muscle memory. Know your role before a code is called — are you doing compressions, running the code cart, managing the airway, or documenting?\n\nDuring the code: focus only on your task. Block out everything else. The team leader will direct. If you're not assigned a role, stay out of the way or ask 'What do you need?' Don't be afraid to speak up if you notice something: 'The rhythm has changed' or 'It's been two minutes since the last epi.' After the code, whether the patient survives or not, allow yourself to feel it. Find a colleague, debrief, and don't drive home immediately if you're shaken. The first code is the hardest. By the tenth, you'll be calm. But it never becomes 'routine' — and it shouldn't.",
      "The head-to-toe assessment can feel overwhelming with six patients. My shortcut: ABCDE. Airway (breathing sounds, oxygen, secretions), Brain (orientation, pupils, neuro status), Cardiac (heart sounds, rhythm, pulses, edema), Digestive (bowel sounds, abdomen, diet tolerance, last BM), and Everything else (skin, IVs, drains, dressings, pain, psychosocial).\n\nThis mnemonic catches 95% of problems in about 5 minutes per patient. I do a quick ABCDE at the start of shift, then focused reassessments based on the patient's diagnosis. A post-op patient gets more C and D attention. A neuro patient gets more B. Document as you assess — don't wait until later. Carry a brain sheet (a printed report sheet where you track vitals, meds, and tasks per patient). The shift brain sheet is the most valuable piece of paper in nursing. It keeps you organized when you're juggling multiple patients and constant interruptions.",
      "Twelve-hour shifts are a marathon, not a sprint. Pace yourself physically: wear compression socks, invest in the best shoes you can afford (Hokas and Danskos are nursing staples), and actually eat during your shift. Not granola bars at the nursing station — a real meal during your break. Your brain needs fuel to make safe decisions at hour 10.\n\nMentally, break the shift into thirds. First third: assess all patients, check orders, address urgent issues. Middle third: execute the care plan — meds, treatments, education. Last third: reassess, chart, prepare for handoff. This rhythm prevents the overwhelm of trying to do everything at once. Hydrate constantly — carry a water bottle and drink between rooms. And protect your days off fiercely. Three 12-hour shifts a week sounds great until you spend your four days off recovering from exhaustion. Schedule real life on your days off. Your recovery time should include something that brings joy, not just sleep.",
      "The nurse-physician relationship can be challenging, especially with physicians who are dismissive or rude. The best approach I've found: SBAR communication. Situation, Background, Assessment, Recommendation. When you call a doctor at 2 AM, leading with a structured SBAR gets respect and action.\n\n'Dr. Smith, this is Nurse Jones on 4 West. Situation: Mr. Johnson in 402 has new-onset chest pain. Background: He's post-op day 2 from a hip replacement, history of CAD. Assessment: his troponins are pending, EKG shows ST changes in leads II, III, and aVF. Recommendation: I'd like to transfer him to the monitored unit and get cardiology involved.' That's professional, comprehensive, and positions you as a clinical partner, not a subordinate. If a physician is genuinely abusive, document and report to your charge nurse and nursing administration. You don't have to tolerate disrespect to be a good nurse.",
      "Nursing documentation is a time suck, but it's also your legal protection. My hack: chart in real-time using templates and smart phrases. Most EHR systems have dot phrases or quick texts — set up templates for your most common documentation: admission assessments, education provided, wound care, fall precautions, restraint checks.\n\nBatch your narrative documentation: instead of opening and closing charts all day, do a focused charting session mid-shift and end-of-shift. Use the downtime (if any) productively. Also, chart what matters: assessments, interventions, patient responses, education, and communication with providers. You don't need to write a novel — you need to paint a picture that another nurse could pick up and understand the patient's status and trajectory. 'If I didn't chart it, it didn't happen' is legally accurate. But 'I charted a novel that no one reads' isn't helping anyone either. Be thorough, accurate, and efficient.",
    ],
  },
  Divorce: {
    titles: [
      "How to tell your spouse you want a divorce",
      "The lawyer you choose matters enormously",
      "Protecting your finances before filing",
      "Co-parenting with someone you're angry at",
      "The emotional stages nobody warns you about",
      "How to handle mutual friends during divorce",
      "Mediation vs. litigation: my experience",
      "Telling your children in an age-appropriate way",
      "The first year after divorce: survival mode",
      "How to rebuild your identity after divorce",
      "Dating after divorce: when you're actually ready",
      "The financial recovery timeline is longer than you think",
      "How to handle holidays and special occasions",
      "When the grief hits unexpectedly",
      "Moving out: practical logistics nobody mentions",
      "How to handle social media during divorce",
      "The support system that saved me",
      "Legal rights you probably don't know about",
      "How to forgive (even if you never forget)",
      "The life after divorce is worth building",
    ],
    contents: [
      "There is no good way to say 'I want a divorce.' But there are less harmful ways. Choose a private time when you won't be interrupted. Be direct: 'I've thought about this for a long time and I want a divorce.' Don't ambush during an argument or use it as leverage. Mean it when you say it.\n\nExpect any reaction: rage, tears, silence, denial, or even relief. Don't try to have the logistics conversation in this moment. The goal of the first conversation is just to communicate the decision. Details come later. If you fear a volatile or unsafe reaction, have the conversation in a public place or with a therapist present. And if you have children, do not tell them before telling your spouse. The unified parental front, even when you're splitting up, matters for their emotional safety.",
      "Your divorce lawyer is the most important hire of this process. Don't choose based on aggression — the 'shark' who promises to destroy your ex will also destroy your finances and your co-parenting relationship. Choose a lawyer who is responsive, strategic, experienced in your state's laws, and who asks about your goals rather than just assuming it's war.\n\nInterview at least three lawyers before deciding. Ask: What's your approach to divorce? How do you handle communication? What are your fees and billing practices? How long do cases like mine typically take? A good lawyer will be honest about timelines and costs. And understand billing: lawyers bill in increments (usually 6-minute blocks). Every email, every phone call, every review counts. Be organized and efficient in your communications to keep costs down. Send bullet-pointed questions rather than stream-of-consciousness emails.",
      "Before filing for divorce, get your financial house in order — quietly. Gather copies of all financial documents: tax returns (last 3 years), bank statements, investment accounts, retirement accounts, mortgage statements, credit card statements, property deeds, insurance policies, and debt records. Store copies somewhere your spouse doesn't have access.\n\nOpen your own bank account and credit card if you don't already have individual ones. Check your credit report. Make copies of important documents (birth certificates, passports, social security cards). Do NOT hide assets, move large sums of money, or rack up joint debt — courts punish this severely. The goal is awareness and documentation, not deception. If your spouse controls the finances, a divorce attorney can help you get temporary access to funds. Knowledge is power in divorce proceedings, and financial ignorance leaves you vulnerable to an unfair settlement.",
      "Co-parenting with your ex is the hardest part of divorce with children. The anger, hurt, and resentment don't disappear because a judge tells you to cooperate. What helped me: mentally reframing my ex as a business partner. We run one business together — raising our children — and I treat our interactions with the same professionalism I'd use with a colleague I don't like.\n\nPractical strategies: communicate through a co-parenting app (OurFamilyWizard or TalkingParents) — it keeps records and reduces conflict. Never badmouth the other parent in front of the kids. Never use children as messengers. Stick to the parenting plan even when it's inconvenient. And when conflict arises, ask yourself: 'Will this matter to my kids in 10 years?' Usually, the answer shifts your perspective. Your children's wellbeing is the shared goal that overrides personal grievances. It's not about being friends with your ex — it's about being functional partners in parenting.",
      "The emotional journey of divorce isn't linear. I expected sadness, but I didn't expect the cycling: grief, anger, relief, guilt, freedom, loneliness, sometimes all in one day. Month three was worse than month one because the shock wore off and reality set in. The six-month mark brought unexpected grief — even though I initiated the divorce.\n\nWhat nobody tells you: you mourn the future you imagined, not just the marriage you had. The retirement together, the grandchildren, the person who'd know your whole story. That anticipatory grief is profound. What helped: therapy (individual, not just the divorce kind), a support group of people going through it simultaneously, and radical self-compassion. Some days I functioned beautifully. Some days I ate cereal for dinner and cried during commercials. Both are okay. The only timeline for grief is your own. People who say 'you should be over it by now' have never lost a life they built.",
    ],
  },
  "1990s": {
    titles: [
      "The internet changed everything and we watched it happen",
      "AOL Instant Messenger defined a generation",
      "The music of the 90s was peak culture",
      "Saturday morning cartoons vs. after-school programming",
      "TGIF and must-see TV shaped our social lives",
      "The mall culture peaked and we were there",
      "N64 and PlayStation changed gaming forever",
      "The fashion we cringe at but secretly miss",
      "Dial-up internet: patience as a virtue",
      "The Walkman to Discman evolution",
      "90s movies that still define nostalgia",
      "The rise of hip-hop mainstream",
      "Blockbuster Video on Friday nights",
      "The yo-yo and pog renaissance",
      "Nickelodeon was our channel",
      "The anxiety of Y2K",
      "Buying CDs at Tower Records",
      "The playground games we've lost",
      "Saturday afternoon at the skate park",
      "When everything felt possible",
    ],
    contents: [
      "The internet went from a weird novelty to the center of everything in about five years. I remember my dad installing our first modem — the screeching dial-up sound, the excitement of a webpage loading one image at a time over 3 minutes. We were witnessing a revolution and most adults had no idea how big it would get.\n\nThe early web was Wild West energy. Personal homepages on Geocities with under-construction GIFs and scrolling marquee text. Chat rooms where you could be anyone. Napster obliterating the music industry overnight. Google appearing and making everything before it seem quaint. We were the last generation to do childhood without the internet and the first to do adolescence with it. That straddling of two worlds gives 90s kids a unique perspective that no other generation quite has.",
      "AIM was social media before social media. Your buddy list was your social hierarchy. Your away message was your first status update. The anxiety of seeing your crush come online, the agony of them not responding, the strategy of crafting the perfect away message with song lyrics that said what you couldn't say directly.\n\nThe sound of a door opening (someone logging on) still triggers nostalgia in every 90s kid. We learned to type fast because of AIM. We learned to communicate in writing because of AIM. We learned the pain of being blocked and the power of blocking. The conversations we had on AIM — staying up until 2 AM on a school night, saying things we'd never say face-to-face — were formative. It was intimate, immediate, and impermanent. No screenshots, no archives (unless you saved your chat logs, you absolute psycho). It was digital connection at its purest.",
      "The 90s gave us grunge, hip-hop's golden age, pop punk, boy bands, Britpop, R&B, and electronic music — all thriving simultaneously. Nirvana, Tupac, Green Day, Backstreet Boys, Oasis, TLC, and The Prodigy all existed in the same musical ecosystem. The radio was genuinely eclectic.\n\nWhat made 90s music special was the combination of authenticity and accessibility. Grunge felt real — it was kids from Seattle playing in garages. Hip-hop was raw storytelling from communities the mainstream had ignored. Even the pop was well-crafted — those boy band harmonies and the R&B production were genuinely excellent. And the album was still king. You'd buy a CD, read the liner notes, listen front to back, and find deep cuts that became your personal anthems. 'Skip to the hit single' wasn't a thing. You invested in the full artistic statement, and that shaped how a generation understood music.",
      "Friday nights at Blockbuster were a ritual. The whole family would go, split up into sections, and negotiate over what to watch. The new releases wall was prime real estate — if the movie you wanted was out, you'd circle back hoping someone would return it. The disappointment of 'All copies are rented' was real.\n\nThe experience of browsing physical media — reading the backs of VHS boxes, judging movies by their cover art, taking a risk on something you'd never heard of — developed a different kind of taste than algorithmic recommendations. You discovered movies by accident, by cover art, by the recommendation of the teenager working the counter. And the late fee dread was universal — that Blockbuster late fee felt like a moral failing. The death of Blockbuster wasn't just a business story. It was the end of a communal entertainment experience that streaming, for all its convenience, has never replaced.",
      "The 90s carried this unique energy of optimism. The Cold War had ended, the economy was booming, the internet promised to connect the world, and the future felt bright. As kids and teenagers, we absorbed that optimism. Everything felt possible — you could become anything, the world was getting better, and technology would solve our problems.\n\nThat particular brand of optimism hasn't existed since. The dot-com crash, 9/11, and everything after punctured it. But growing up in that window — when the worst thing on the news was a presidential scandal, when the biggest technological concern was whether your Tamagotchi survived — shaped a generation of idealists. We still carry that kernel of 'everything could work out' even as adults in a more complicated world. The 90s didn't just give us good music and bad fashion. They gave us a foundational belief that things can get better, and I think that's the most valuable thing they left us.",
    ],
  },
  Minimalism: {
    titles: [
      "How I got rid of 80% of my stuff",
      "The mindset shift that makes minimalism stick",
      "Minimalism is not about having nothing",
      "How to declutter when your partner isn't on board",
      "The capsule wardrobe that simplified my mornings",
      "Digital minimalism matters too",
      "How minimalism saved me money",
      "The sentimental items problem",
      "Minimalism with kids is possible",
      "The environmental case for owning less",
      "How to resist consumer culture",
      "Minimalism in the kitchen",
      "The one-in-one-out rule",
      "Decluttering methods compared",
      "How minimalism improved my mental health",
      "Minimalist travel packing",
      "The minimalist home tour cliché and what's real",
      "When minimalism becomes its own kind of excess",
      "Gift-giving as a minimalist",
      "The freedom of wanting less",
    ],
    contents: [
      "I didn't get rid of everything at once. I started with the easy stuff: expired food, broken items, duplicate tools, clothes that didn't fit. Then I moved to the harder categories: books I'd never reread, kitchen gadgets used once, hobby supplies for hobbies I'd abandoned. The final stage was the hardest: sentimental items, 'just in case' items, and things tied to identity.\n\nThe process took six months. I used the 'box method' for uncertain items: put them in a labeled box with a date. If I didn't open the box in 90 days, I donated it without looking inside. The revelation was how little I missed. Of the hundreds of items I donated, I've thought about maybe three. The empty space in my home created empty space in my mind. Less stuff means less to clean, less to organize, less to think about. That cognitive freedom is the real benefit of minimalism.",
      "Minimalism isn't about the stuff — it's about intentionality. The question isn't 'How little can I own?' It's 'Does this add value to my life?' Some minimalists own 50 things. I own more than that in my kitchen alone, and that's fine, because I cook daily and every tool earns its space.\n\nThe mindset shift that made minimalism sustainable: stop asking 'Might I need this someday?' and start asking 'Does this serve the life I'm actually living?' Future-you doesn't need 14 'just in case' items. Present-you needs space, clarity, and the things that support your daily reality. This shift also changes how you acquire things. Before buying, I ask: where will this live? What will I remove to make room? Will I still want this in a month? That pause between desire and purchase is where minimalism actually lives.",
      "When I tell people I'm a minimalist, they picture a bare white room with one chair. Real minimalism looks different for everyone. My home has color, plants, books (curated, not hoarded), art, and comfortable furniture. It just doesn't have stuff I don't use, need, or love.\n\nMinimalism isn't about deprivation or aesthetic. A minimalist with three kids has a different home than a minimalist living alone. A minimalist who loves cooking has a full kitchen. A minimalist who loves fashion has a thoughtful wardrobe. The common thread isn't the number of possessions — it's the absence of excess. Everything in a minimalist's space has a reason to be there. That intentionality creates calm, reduces decision fatigue, and frees up resources (time, money, energy, space) for what actually matters to you.",
      "My wife thought I was having a breakdown when I started decluttering. She wasn't interested in minimalism and felt like I was trying to control our shared space. The conflict was real and required careful navigation.\n\nHere's what worked: I started with my own stuff only. My closet, my desk, my side of the garage. I didn't touch her belongings or make comments about them. As she saw my spaces become calmer and easier to maintain, she got curious. I shared what I was learning without preaching. When she asked questions, I answered honestly. Six months later, she decluttered her closet on her own. A year later, we tackled shared spaces together. The lesson: lead by example, not by mandate. You can't force minimalism on someone. But you can demonstrate its benefits in your own spaces and let the results speak for themselves.",
      "Going from 30+ items in my closet to a 33-item capsule wardrobe was the most practical minimalism move I made. Everything coordinates with everything else. Getting dressed takes 2 minutes. I never stand in front of my closet paralyzed by choice.\n\nThe formula: 5 pairs of bottoms (jeans, chinos, shorts), 12 tops (mix of casual and dressy), 3 outerwear pieces, 3 pairs of shoes, and accessories. All in a cohesive color palette (navy, white, gray, olive, with one accent color). I replace items only when they wear out, and I buy quality over quantity. The financial impact was significant — I spent $3,000+/year on clothes before, now about $500/year. And I look better because everything fits well and coordinates. The irony of minimalism: limiting your options often leads to better outcomes than unlimited choice.",
    ],
  },
  "Remote Work": {
    titles: [
      "How to set up a home office that actually works",
      "The loneliness of remote work is real",
      "Setting boundaries when home is the office",
      "How to stay visible in a remote team",
      "The morning routine that replaced my commute",
      "Managing distractions at home",
      "Remote communication done right",
      "How to negotiate a remote work arrangement",
      "The ergonomic setup that saved my back",
      "Time zone challenges and solutions",
      "How to build culture in a remote team",
      "The coworking space experiment",
      "Remote work with kids at home",
      "How to take PTO when you work from home",
      "The tools that make remote work seamless",
      "How to combat Zoom fatigue",
      "Career growth while working remotely",
      "The hybrid compromise",
      "How to know if remote work suits you",
      "Building trust with a remote manager",
    ],
    contents: [
      "Your home office is an investment in your productivity and health. The non-negotiables: a dedicated space with a door (not the kitchen table), a real desk at proper height, an external monitor, a comfortable chair, and good lighting. The door matters most — it's the physical boundary between work and life.\n\nI spent $2,000 setting up my home office and it was worth every penny. A standing desk converter ($300), a refurbished Herman Miller chair ($400), a 27-inch monitor ($350), a good webcam ($100), a ring light ($40), and a white noise machine ($30). The rest went to a bookshelf, plants, and making the space pleasant. You spend 8+ hours a day here — it should be a space you enjoy. The ROI is real: I'm more productive, my back doesn't hurt, and I look professional on camera.",
      "After two years of remote work, I hit a wall of isolation that I didn't see coming. The casual interactions — coffee chats, hallway conversations, lunch outings — provided social connection I took for granted. Without them, I was talking to my cat and watching the clock.\n\nThe solutions that worked: a weekly in-person coworking day at a local space, virtual coffee chats with colleagues (scheduled, not spontaneous), a non-work community (I joined a local basketball league), and daily walks where I intentionally engage with people — the barista, neighbors, anyone. Remote work gives you incredible flexibility, but you have to deliberately fill the social void that an office automatically fills. The people who thrive remotely are the ones who build social structure into their lives proactively, not the ones who assume isolation won't affect them.",
      "The biggest remote work trap: you never actually stop working. The commute used to create a physical and temporal boundary. Without it, your laptop is always right there, the email is always one tab away, and 'just one more thing' becomes three more hours.\n\nMy boundaries: I start at 8:30 AM and close the laptop at 5:30 PM. Hard stop. I have a 'shutdown ritual' — I review tomorrow's tasks, close all tabs, say 'shutdown complete' out loud (silly but effective), and physically leave my office. I don't have work email on my phone. On weekends, my office door stays closed. These boundaries require constant reinforcement because the temptation to 'just check' is always there. But without them, you work more, produce less, and burn out faster. The research is clear: people who set remote work boundaries are more productive and more satisfied than those who blend work and life into an undifferentiated blur.",
      "In a remote environment, out of sight truly means out of mind. The colleagues who get promoted are the ones who make their work visible. This isn't about self-promotion — it's about proactive communication.\n\nStrategies: send weekly updates to your manager summarizing what you accomplished, what you're working on, and where you need help. Speak up in meetings — even a brief contribution keeps you in people's awareness. Share your work in progress, not just finished products. Document your processes and share them with the team. Volunteer for cross-functional projects that increase your visibility. And maintain one-on-ones with your manager religiously — this is your primary relationship and it needs regular nurturing. The remote workers who stall in their careers are usually the ones who assume quality work speaks for itself. It doesn't. You have to speak for it too.",
      "Zoom fatigue is a neurological reality, not just a buzzword. Video calls require constant focus on faces, self-monitoring of your own expression, and the cognitive load of reading non-verbal cues through a screen. Your brain works harder in 1 hour of video calls than 2 hours of in-person meetings.\n\nMy rules for managing it: cameras off is okay for status meetings and information broadcasts. Cameras on for collaborative discussions and one-on-ones. No meetings over 45 minutes without a break. No back-to-back video calls — build 15-minute buffers. Walk during phone calls when video isn't needed. And designate one meeting-free day per week for deep work. I also turned off self-view — watching your own face for hours is uniquely draining. These changes reduced my daily video time from 5 hours to 2, and my energy levels and actual output both improved dramatically.",
    ],
  },
  "Los Angeles": {
    titles: [
      "The traffic is real: how to survive LA driving",
      "Finding community in a city built for cars",
      "The neighborhoods that define LA",
      "How to eat well in LA on a budget",
      "The hidden hiking gems most people miss",
      "Why LA gets a bad rap and what's actually great",
      "Apartment hunting in LA: a survival guide",
      "The entertainment industry reality check",
      "LA's public transit is better than you think",
      "Making friends in the flakiest city in America",
      "The beach culture explained",
      "How to handle the cost of living",
      "The taco ranking you actually need",
      "Earthquakes: preparation and reality",
      "Why everyone who moves to LA either loves or hates it",
      "The farmers market circuit in LA",
      "Living in LA without a car (it's possible)",
      "The diversity that makes LA special",
      "How to enjoy LA without going broke",
      "The fire season reality",
    ],
    contents: [
      "LA traffic isn't an inconvenience — it's a lifestyle factor you must plan around. The 405, the 10, the 101 — during rush hour (7-10 AM and 3-7 PM), they're parking lots. The commute time between any two points in LA can range from 15 minutes to 90 minutes depending on the time of day. Plan your life accordingly.\n\nSurvival tips: use Waze religiously, it finds routes Google Maps misses. Schedule your life to avoid peak hours — leave at 6:30 AM or after 10 AM. Live close to work (this is the most impactful decision you'll make in LA). Podcasts and audiobooks make traffic educational. Use surface streets during rush hour — Sepulveda, La Cienega, and Fairfax are often faster than the freeway. And seriously consider neighborhoods that keep your commute under 30 minutes. In LA, where you live relative to where you work determines your quality of life more than any other factor.",
      "LA is a collection of neighborhoods pretending to be one city. Silver Lake is the creative class, hipster without trying too hard. Los Feliz is Silver Lake's sophisticated older sibling. DTLA is the urban renaissance experiment. Santa Monica is the beach-town-within-a-city. Koreatown is the most exciting food neighborhood in America. Highland Park is rapidly gentrifying but still has character.\n\nThe Valley (Sherman Oaks, Studio City, Burbank) is where you get space and quiet but sacrifice proximity to the Westside. Venice is past its bohemian prime but still has energy. Culver City has emerged as a culinary and tech hub. Each neighborhood has its own personality, restaurants, coffee shops, and community. Choose where to live based on the micro-community, not the macro-city. Most Angelenos rarely leave their neighborhood bubble except for work and special occasions. Your neighborhood IS your city in LA.",
      "LA's food scene is arguably the best in America, and you don't need to spend a lot to experience it. The taco trucks alone make living here worthwhile. Leo's Tacos on La Brea for al pastor. Mariscos Jalisco in Boyle Heights for shrimp tacos. Tire Shop Taqueria in East LA for everything.\n\nBeyond tacos: Koreatown is a food paradise — all-you-can-eat Korean BBQ for $25, soon tofu stew for $12, late-night fried chicken from Kyochon. Thai Town on Hollywood Boulevard has the best Thai food outside of Thailand (Jitlada for Southern Thai, Pa Ord for boat noodles). The SGV (San Gabriel Valley) is a Chinese food wonderland — Din Tai Fung for soup dumplings, Newport Seafood for lobster, and 100 other spots that rival anything in Asia. Ethiopian on Fairfax, Oaxacan in Koreatown, Persian in Westwood — LA's diversity translates directly to the plate, and the competition keeps quality high and prices reasonable.",
      "Everyone thinks LA is just Hollywood and beaches, and then they're surprised it's actually a real city with real people doing real things. Yes, the entertainment industry is here. No, not everyone works in it. LA has massive tech, healthcare, aerospace, finance, and nonprofit sectors.\n\nWhat's actually great about LA: the weather (300+ sunny days a year is not an exaggeration), the hiking (you can summit a mountain and swim in the ocean in the same day), the cultural diversity (the most diverse city in America), the food (see my other post), and the creative energy. Every kind of person lives here, and there's a community for every interest. The bad rap comes from the traffic, the cost, and the surface-level interactions. But once you find your neighborhood and your people, LA reveals itself as a deeply rewarding place to live. It just takes longer to crack than other cities.",
      "LA earthquake preparation is like fire extinguisher preparation — boring until you need it. The Big One is coming (geologically certain, timeline unknown). Your preparation: secure heavy furniture to walls, keep an earthquake kit (water, food, flashlight, radio, first aid, medications, cash) accessible, and know how to shut off your gas line.\n\nDuring a quake: Drop, Cover, Hold On. Get under a sturdy table or desk, cover your head, and hold on until the shaking stops. Don't run outside — falling debris is the biggest danger. Don't stand in doorways (old advice, now outdated). After the quake: check for gas leaks, check on neighbors, and avoid damaged buildings. Have a meeting point planned with your household if phones don't work. The reality: most earthquakes you'll feel are minor rollers that last a few seconds. They become normal quickly. But the preparation for the big one is like insurance — the investment is small and the potential payoff is everything.",
    ],
  },
  Depression: {
    titles: [
      "The difference between sadness and depression",
      "How to ask for help when you can't explain what's wrong",
      "My medication journey: what I wish I knew from the start",
      "The daily habits that keep me functional",
      "How depression affects relationships",
      "Exercise for depression: what actually helps",
      "The therapist shopping process",
      "How to support a depressed partner",
      "Depression and productivity: lowering the bar to survive",
      "The physical symptoms of depression nobody discusses",
      "How to handle depression at work",
      "The grief that isn't grief",
      "Social withdrawal and how to fight it",
      "The role of sleep in depression management",
      "When depression comes back after recovery",
      "How to talk about depression with family",
      "The small wins approach",
      "Seasonal depression: more than winter blues",
      "How to maintain hygiene during depressive episodes",
      "The hope on the other side",
    ],
    contents: [
      "Sadness has a cause and a natural endpoint. Depression is sadness without a floor. It's the inability to feel pleasure in things that used to bring joy. It's exhaustion that sleep doesn't fix. It's a heaviness that sits on your chest all day, every day, for weeks or months. Sadness makes you cry; depression makes you feel nothing.\n\nThe diagnostic line is roughly two weeks: if you've experienced persistent low mood, loss of interest, sleep changes, appetite changes, fatigue, difficulty concentrating, feelings of worthlessness, or thoughts of death for more than two weeks, that's clinical depression. It's not a character flaw or a bad attitude. It's a medical condition involving neurotransmitter imbalances, neural pathway changes, and often genetic vulnerability. Knowing the difference matters because depression requires treatment (therapy, medication, or both), while normal sadness requires time and support.",
      "The hardest part of depression is that it steals your ability to advocate for yourself. You need help the most when you're least able to ask for it. What worked for me: a simple text to my closest friend. Not an explanation, not a plan — just 'I'm not okay and I don't know what to do.'\n\nIf even that feels impossible, here are lower-barrier options: text the Crisis Text Line (text HOME to 741741). Call your doctor's office and say 'I think I'm depressed and I need to be seen.' Write a note and hand it to someone. Depression lies to you — it says nobody cares, nothing will help, you're a burden. Those are symptoms of the disease, not truths. The first step doesn't have to be big. It just has to happen. And if the first person you tell doesn't take it seriously, tell someone else. Keep telling people until someone listens.",
      "I've been on three different antidepressants over seven years. The first one (an SSRI) worked for the depression but killed my libido and made me gain 20 pounds. The second (a different SSRI) caused insomnia. The third (an SNRI) is my Goldilocks — effective with manageable side effects. Finding the right medication took 18 months of trial and error.\n\nWhat I wish someone had told me: antidepressants take 4-6 weeks to reach full effect. The first 2 weeks often have increased side effects and sometimes worsened mood. This is normal and terrifying. Don't quit after one week because you 'don't feel different' or 'feel worse.' Give it the full 6-week trial unless side effects are unbearable or dangerous. Medication isn't a cure — it raises the floor so you can function. Combined with therapy, it raises the ceiling. And there's no shame in needing medication long-term. I'll probably take mine for life, the same way someone with diabetes takes insulin. It's managing a chronic condition, not a personal failure.",
      "On my worst days, my 'habits' are: get out of bed, drink water, take my medication. That's it. That's a successful day in a depressive episode. The bar needs to be that low sometimes, because setting unreachable standards during depression just adds guilt to the heaviness.\n\nOn moderate days: get up at the same time, go outside for 10 minutes (sunlight matters), one small task (wash dishes, take a shower, respond to one email), and connect with one person (even just a text). On better days, I add exercise, cooking, and social interaction. The key is matching your expectations to your actual capacity that day, not your capacity on a good day. Depression is cyclical — there are better days and worse days. Working with the cycle instead of against it reduces the shame spiral that makes everything worse. And tracking your mood (even with a simple 1-10 number each day) helps you see patterns and progress that depression's distorted lens hides from you.",
      "Depression doesn't just live in your mind — it lives in your body. Chronic fatigue where you sleep 12 hours and wake up exhausted. Joint and muscle pain with no physical cause. Headaches. Digestive problems. Changes in appetite (I lose mine; others overeat). Psychomotor retardation — physically moving slower, speaking slower, thinking slower.\n\nFor years, I went to doctors for my physical symptoms and nobody connected them to depression. I had blood tests for fatigue, an MRI for headaches, a GI workup for stomach issues — all normal. It wasn't until a therapist heard the full picture that depression was identified as the cause. This mind-body connection is well-documented but under-discussed. The physical symptoms are real, not imagined. And they often improve with depression treatment. When I started my current medication, my chronic back pain reduced by 70%. The pain was real — but the source was neurological, not musculoskeletal.",
    ],
  },
  Bartender: {
    titles: [
      "The cocktail knowledge that earns respect and tips",
      "How to control a busy bar without losing your mind",
      "Speed vs. quality: finding the balance",
      "Dealing with drunk customers safely",
      "The inventory system that prevents theft",
      "How to build a loyal following",
      "The bar setup that maximizes efficiency",
      "Upselling drinks without annoying people",
      "How to handle the late-night crowd",
      "The mocktail trend is actually great for business",
      "Training your palate: why it matters",
      "Bar politics and how to navigate them",
      "The transition from serving to bartending",
      "How to make classics properly",
      "Building drink menus that sell",
      "The regulars who keep the lights on",
      "How to handle being hit on constantly",
      "Managing your health behind the bar",
      "The equipment worth investing in",
      "When to cut someone off gracefully",
    ],
    contents: [
      "You don't need to know 500 cocktails. You need to know the foundations: the Old Fashioned (spirit, sugar, bitters), the Martini (spirit, vermouth), the Sour (spirit, citrus, sweetener), the Highball (spirit, mixer). Every cocktail is a variation of these templates. Once you understand the ratios and balances, you can riff on anything.\n\nThe cocktails that earn respect: a perfectly balanced Manhattan (2oz rye, 1oz sweet vermouth, 2 dashes Angostura, stirred not shaken), a proper Daiquiri (2oz white rum, 1oz lime, 3/4oz simple, shaken hard), and a Negroni (equal parts gin, Campari, sweet vermouth). These are simple drinks made well, and they separate professionals from amateurs. Also, learn to make them fast — a great cocktail that takes 5 minutes during a rush helps nobody. Practice your movements until they're muscle memory.",
      "A Friday night with a packed bar and a 3-deep line is a choreographed chaos that only works with systems. My system: work the rail left to right, acknowledge everyone with eye contact and a nod (this buys you time), batch similar orders, and never make one drink at a time when you can make three.\n\nThe speed comes from station setup: every bottle, every tool, every garnish within arm's reach without looking. Your well should be muscle memory — you should be able to reach for the vodka with your eyes on the customer. Two hands working simultaneously: one pours while the other grabs the next glass. And communicate with your barback — they're your lifeline. A good barback gets ice, stocks glasses, clears the bar, and anticipates needs. Buy them dinner after a busy shift and they'll run through walls for you.",
      "Cutting someone off is the most important skill a bartender has, and it's the one nobody wants to use. The liability is on you — if an over-served customer drives and hurts someone, you and the establishment can be held legally responsible. That reality should override any concern about tips or conflict.\n\nHow to do it: be discreet, be firm, be kind. Pull them slightly aside if possible. 'Hey man, I think you've had a good night. How about some water and I'll call you a ride?' Most people accept it if you preserve their dignity. If they argue, stay calm and don't engage in debate: 'I understand you're frustrated, but I'm not able to serve any more alcohol tonight. Let me get you some water.' If they become aggressive, involve security. Never apologize for cutting someone off — it's a safety decision. And document it: time, customer description, behavior observed. This protects you if anything happens.",
      "Mocktails used to be afterthoughts — a Shirley Temple and a virgin Piña Colada. Now they're a genuine revenue opportunity. The sober-curious movement means 30% of adults are drinking less, and they're willing to pay $10-14 for a well-crafted non-alcoholic drink. That's nearly the same margin as a cocktail without the liquor cost.\n\nMy bar's mocktail menu outsells several cocktails. The key: treat them with the same creativity and technique as alcoholic drinks. Use fresh juices, house-made syrups, bitters (most are non-alcoholic), and interesting textures (egg white foam, muddled herbs, sparkling elements). Serve them in proper glassware with a garnish. When a customer who's not drinking gets a beautiful, complex mocktail instead of a soda, they feel included and valued. They tip better, they come back, and they bring friends. The bars that dismiss mocktails are leaving money and loyalty on the table.",
      "Bartending takes a physical toll that people outside the industry don't understand. Standing on hard floors for 8-12 hours, repetitive motion (shaking, pouring, wiping), lifting kegs, and the constant sensory bombardment of noise, smoke machines, and flashing lights.\n\nProtect yourself: anti-fatigue mats behind the bar make a massive difference. Compression socks reduce leg swelling. Stretch your wrists and forearms before shifts — bartender's tendinitis is real. Wear earplugs on loud nights (custom-molded ones filter noise while allowing conversation). Stay hydrated — the bar environment dehydrates you faster than you think. And watch the late-night eating. It's tempting to slam pizza at 3 AM after every shift, but that habit plus inconsistent sleep equals rapid weight gain. Meal prep for post-shift eating. Your future self will thank you. The bartenders who last 20+ years in this industry are the ones who treat their body like the tool it is.",
    ],
  },
  "Grad School": {
    titles: [
      "Is grad school worth it? The honest calculation",
      "How to choose between programs",
      "The advisor relationship makes or breaks your experience",
      "Funding your grad degree without drowning in debt",
      "Imposter syndrome in grad school is universal",
      "How to manage the reading load",
      "The dissertation process demystified",
      "Work-life balance in grad school (it's possible)",
      "How to network at academic conferences",
      "The publish or perish reality",
      "Teaching while studying: the dual role",
      "How to handle toxic lab or department culture",
      "The mental health crisis in graduate education",
      "Skills grad school teaches that nobody mentions",
      "How to decide between academia and industry",
      "The qualifier exam survival guide",
      "Building a research agenda",
      "How to write a literature review efficiently",
      "The job market preparation timeline",
      "What I'd tell my first-year self",
    ],
    contents: [
      "Before applying to grad school, do the ROI calculation honestly. For professional programs (MBA, JD, MD): compare the cost of tuition plus lost income against the expected salary increase over 10 years. For PhD programs: never pay for a PhD — if a program doesn't fund you, it's either not a good program or you're not a strong enough candidate yet.\n\nThe calculation most people skip: opportunity cost. Two years in an MBA program isn't just tuition — it's two years of salary you're not earning, career progression you're not making, and life experiences you're deferring. For some careers (medicine, law, academia, certain technical fields), grad school is genuinely necessary. For many others, work experience plus targeted certifications achieves the same outcome at a fraction of the cost. Talk to people 5-10 years out of the programs you're considering. Not admissions, not current students — graduates with perspective. Their honest assessment is worth more than any ranking.",
      "Your advisor/supervisor is the single most important factor in your grad school experience — more important than the school's ranking, the program's reputation, or the research topic. A good advisor provides guidance, advocates for you, gives honest feedback, respects your time, and helps you build a career. A bad advisor can make you miserable, delay your graduation, and damage your professional development.\n\nBefore committing: talk to current students and recent graduates of that advisor. Ask directly: 'What's their communication style? How do they handle disagreements? How long do their students take to graduate? Are they available when you need them?' Visit the lab or department and observe the culture. If current students seem stressed, unhappy, or afraid of their advisor, run. The prestige of working with a famous researcher means nothing if they're absent, abusive, or dismissive. Your advisor relationship will define your experience far more than the school name on your diploma.",
      "The reading load in grad school is intentionally impossible. You're not supposed to read every word of every assigned paper. The skill grad school teaches is strategic reading: abstract, conclusion, key figures, and then skim the methods and results for the papers most relevant to your work.\n\nFor courses: read all assigned papers at the abstract + conclusion level. Deep-read only the 2-3 most relevant to discussion or your research. For your research: maintain a reference manager (Zotero is free and excellent), and annotate as you read. Create summary sheets for key papers in your area: what did they find, what methods did they use, what are the limitations? These summaries become your literature review foundation. And read actively: don't just absorb — argue with the paper. What would you do differently? What questions remain unanswered? This critical engagement is what transforms you from a student into a researcher.",
      "The mental health crisis in graduate education is well-documented but poorly addressed. Graduate students experience depression and anxiety at six times the rate of the general population. The causes are structural: low pay, long hours, uncertain career prospects, power imbalances with advisors, isolation, and constant evaluation.\n\nWhat helped me survive: therapy (most universities offer free counseling — use it), a friend group outside of academia (people who don't talk about research), regular exercise, and firm time boundaries (no work after 8 PM, one full day off per week). Also, give yourself permission to not make grad school your entire identity. You're a person who happens to be in grad school, not a grad student who happens to be a person. The programs and advisors who normalize struggle and support mental health produce better researchers than those who glorify suffering. If your program treats burnout as a badge of honor, that's a red flag about the culture, not a reflection of what excellence requires.",
      "Grad school taught me skills I use daily that never appeared on any syllabus: how to read critically and identify BS, how to break an overwhelming project into manageable phases, how to communicate complex ideas clearly, how to handle criticism of my work without taking it personally, how to teach myself anything using primary sources, and how to persist through years-long projects with uncertain outcomes.\n\nThese skills are arguably more valuable than the specific content knowledge. A PhD in biology doesn't just mean you know biology — it means you can independently identify problems, design approaches to solve them, execute those approaches, and communicate the results. That meta-skill set transfers to any field. The graduates who thrive after grad school (in academia or industry) are the ones who recognize and articulate these transferable skills. 'I can manage ambiguous long-term projects' is more compelling in a job interview than 'I studied the phosphorylation dynamics of a particular protein.'",
    ],
  },
};

// Generic content for topics not in the specific map
function getGenericContents(topicName: string): { titles: string[]; contents: string[] } {
  return {
    titles: [
      `The most important thing about ${topicName}`,
      `Common mistakes people make with ${topicName}`,
      `How to get started with ${topicName}`,
      `The truth about ${topicName} nobody talks about`,
      `Advanced tips for ${topicName}`,
      `How ${topicName} changed my perspective`,
      `The beginner's guide to ${topicName}`,
      `What I wish I knew about ${topicName} earlier`,
      `${topicName}: myths vs. reality`,
      `How to navigate ${topicName} successfully`,
      `The resources that helped me with ${topicName}`,
      `Building confidence in ${topicName}`,
      `The community around ${topicName}`,
      `How to handle setbacks in ${topicName}`,
      `The daily practice that improved my ${topicName}`,
      `${topicName} on a budget`,
      `The mental game of ${topicName}`,
      `How ${topicName} connects to everything else`,
      `Finding your own path in ${topicName}`,
      `The future of ${topicName}`,
    ],
    contents: [
      `The most important lesson I've learned about ${topicName} is that consistency beats intensity every time. People dive in with maximum effort for two weeks and then burn out. The ones who succeed take a moderate, sustainable approach and show up every single day. It's not glamorous, but it works. Progress compounds in ways that aren't visible day-to-day but are dramatic over months.\n\nThe second lesson: find a community. Doing anything alone is harder than doing it with others who understand the journey. Whether that's an online forum, a local group, or even one friend on the same path — connection provides accountability, knowledge sharing, and emotional support that willpower alone can't match.`,
      `The biggest mistake people make with ${topicName} is overthinking the start and underthinking the follow-through. They spend weeks researching the perfect approach, the optimal tools, the ideal conditions — and never actually begin. Or they begin with so much ambition that they create an unsustainable routine that collapses within a month.\n\nStart imperfectly. Adjust as you go. The information you need will reveal itself through experience, not research. The second biggest mistake: comparing your beginning to someone else's middle. Everyone you admire started where you are. Their polished result is the product of years of messy, imperfect practice. Focus on your own trajectory, not anyone else's highlight reel.`,
      `Getting started with ${topicName} is simpler than the internet makes it seem. You need three things: a basic understanding of the fundamentals (one good book or course, not twelve), a way to practice regularly, and someone slightly more experienced to learn from. That's it. Everything else — the specialized equipment, the advanced techniques, the optimization strategies — comes later.\n\nThe biggest barrier to starting is the belief that you need to know everything before you begin. You don't. You need to know enough to take the first step, and then the second step reveals itself. I spent three months preparing to start and could have started on day one with what I actually needed. Don't let preparation become procrastination.`,
      `There's a lot of conventional wisdom about ${topicName} that's either outdated or was never true to begin with. The biggest myth: that natural talent determines success. Research consistently shows that deliberate practice, quality mentorship, and persistent effort are far stronger predictors of achievement than innate ability. The 'talented' people you admire have usually just been practicing longer or more deliberately.\n\nThe truth nobody talks about: the middle phase is the hardest. The beginner phase is exciting — everything is new. The advanced phase is rewarding — you see mastery emerging. But the intermediate plateau, where progress is slow and the novelty has worn off, is where most people quit. Knowing this in advance helps you push through. The plateau isn't a sign you've peaked — it's a sign that deeper learning is being consolidated beneath the surface.`,
      `Advanced ${topicName} comes down to the details that beginners overlook. It's the difference between knowing what to do and understanding why. When you understand the principles behind the practices, you can adapt to any situation instead of following rigid rules that break in novel circumstances.\n\nMy advice for advancing: teach what you know. Explaining concepts to beginners reveals gaps in your own understanding that passive learning misses. Seek feedback from people better than you — honest critique accelerates growth more than any other single factor. And specialize. The advanced practitioner who's great at everything is actually mediocre at everything. Pick the area of ${topicName} that energizes you most and go deep. Depth creates expertise that breadth never will.`,
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "all"; // "posts", "comments", or "all"
    const topicOffset = body.topicOffset || 0; // for batched comment seeding
    const topicLimit = body.topicLimit || 5; // process N topics at a time for comments

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all topics
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("id, name");
    if (topicsError) throw topicsError;

    // Get all user IDs
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .order("created_at");
    if (profilesError) throw profilesError;

    const userIds = profiles!.map((p: { id: string }) => p.id);

    let totalInserted = 0;
    let totalComments = 0;

    if (mode === "posts" || mode === "all") {
      // Clear existing data
      await supabase.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    for (const topic of topics!) {
      const topicData = topicPosts[topic.name] || getGenericContents(topic.name);
      const posts = [];

      for (let rank = 1; rank <= 100; rank++) {
        const titleIndex = (rank - 1) % topicData.titles.length;
        const contentIndex = (rank - 1) % topicData.contents.length;
        const userIndex = (rank - 1) % userIds.length;

        const cycleNum = Math.floor((rank - 1) / topicData.titles.length);
        let title = topicData.titles[titleIndex];
        if (cycleNum > 0) {
          const suffixes = [
            " — an update",
            " — part two",
            " — a different take",
            " — revisited",
            " — my experience",
            " — another perspective",
            " — the sequel",
            " — one more thing",
          ];
          title += suffixes[cycleNum % suffixes.length];
        }

        posts.push({
          topic_id: topic.id,
          author_id: userIds[userIndex],
          title,
          content: topicData.contents[contentIndex],
          score: 101 - rank,
          comment_count: 0,
        });
      }

      // Insert in batches of 50
      for (let i = 0; i < posts.length; i += 50) {
        const batch = posts.slice(i, i + 50);
        const { error: insertError } = await supabase
          .from("posts")
          .insert(batch);
        if (insertError) {
          console.error(`Error inserting batch for ${topic.name}:`, insertError);
          throw insertError;
        }
        totalInserted += batch.length;
      }
      }
    } // end posts mode

    if (mode === "comments" || mode === "all") {
      // Delete existing comments
      await supabase.from("comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Fetch all posts with their topic names
      const allPosts: { id: string; topic_name: string; author_id: string }[] = [];
      for (const topic of topics!) {
        let from = 0;
        const pageSize = 1000;
        while (true) {
          const { data: postsPage, error: postsError } = await supabase
            .from("posts")
            .select("id, author_id")
            .eq("topic_id", topic.id)
            .range(from, from + pageSize - 1);
          if (postsError) throw postsError;
          if (!postsPage || postsPage.length === 0) break;
          for (const p of postsPage) {
            allPosts.push({ id: p.id, topic_name: topic.name, author_id: p.author_id });
          }
          if (postsPage.length < pageSize) break;
          from += pageSize;
        }
      }

      console.log(`Seeding comments for ${allPosts.length} posts...`);

      const topicCommentTemplates: Record<string, string[]> = {
        Parent: [
          "This resonates deeply. We went through something similar with our toddler and the biggest lesson was patience. It's easy to read advice online and think 'that sounds simple,' but executing it at 3 AM when you haven't slept in two days is a completely different story. What finally worked for us was lowering our expectations and accepting that progress isn't linear. Some weeks our kid would sleep perfectly, then teething would hit and we'd be back to square one. The key is not to see setbacks as failures but as normal parts of development. Also — and I can't stress this enough — tag-team with your partner. One person doing all the heavy lifting leads to resentment fast. We started doing alternating nights where one parent was 'on duty' and the other could sleep without guilt. It saved our marriage honestly.",
          "I wish more parents talked about this openly. There's so much judgment in parenting communities that people are afraid to share what actually works for fear of being called a bad parent. My experience: every family is different and what works for one kid might be terrible for another. We have two children and they required completely opposite approaches for almost everything — sleep, food, discipline, all of it. The advice I'd give any new parent is to collect strategies like tools in a toolbox. Read widely, listen to experienced parents, but ultimately trust your instincts about YOUR child. You know them better than any book or blog does. And give yourself grace. The fact that you're even thinking about how to be a better parent means you're already doing a good job.",
          "Adding my two cents from the other side of this — my kids are now teenagers and I can tell you that the things I stressed about when they were little (screen time, organic food, the perfect preschool) mattered way less than I thought. What actually mattered: showing up consistently, apologizing when I was wrong, and making sure they knew our home was a safe place to feel any emotion. My daughter recently told me that the thing she remembers most from childhood isn't any activity or vacation — it's that I always sat with her when she was upset without trying to fix it immediately. Just being present. That broke me in the best way. So if you're in the trenches right now, I promise it gets easier, and the love you're pouring in right now is building something beautiful even when it doesn't feel like it.",
          "The financial aspect is something nobody prepares you for adequately. Beyond the obvious costs like diapers and food, there are the hidden expenses that add up: birthday party gifts for every classmate, school supplies lists that somehow cost $200, the activity fees, the equipment, the specialized clothing they outgrow in three months. We sat down and tracked every kid-related expense for a year and it was genuinely shocking — about 40% more than we had budgeted. What helped: we started a kids-specific budget category, bought secondhand aggressively (Facebook Marketplace and consignment shops are goldmines), and learned to say no to the pressure to enroll in every enrichment activity. Your kids don't need to do travel soccer, piano lessons, AND art class simultaneously. Pick one or two and let them have unstructured time.",
          "Something that transformed our parenting was family meetings. Every Sunday evening, we sit down — even with our 5-year-old — and talk about the week ahead. What's happening at school, any worries, things people are looking forward to. We also do 'roses and thorns' — each person shares one good thing and one hard thing from the past week. It sounds corny but it's created a culture of communication in our house that pays dividends daily. The kids bring up issues proactively now instead of bottling them up. And they've learned that problems are normal things that we solve together, not catastrophes to panic about. Start this early if you can — it's harder to introduce with older kids who aren't used to sharing."
        ],
        Waiter: [
          "Ten years in the industry and this is spot on. The thing I'd add is that server burnout is real and it sneaks up on you. You're making decent money, the schedule is flexible, and the social aspect is fun — but one day you realize you haven't had a Friday night off in three years, your feet hurt constantly, and you've been self-medicating with shift drinks. The servers who last long-term are the ones who treat this like a real career: they invest in continuing education (wine certifications, sommelier training, management courses), they save and invest their cash tips instead of spending them that night, and they set boundaries about scheduling. I eventually moved into management and then consulting, but the skills I learned on the floor — reading people, multitasking under pressure, sales — are genuinely transferable to any client-facing role.",
          "The upselling piece is so important and most servers do it wrong. They recite specials like a grocery list, which is boring and forgettable. The technique that actually works: personal recommendation with a story. Instead of 'our specials tonight are the salmon and the short rib,' try 'I had the short rib during staff meal yesterday and honestly it was one of the best things I've eaten here — the braising makes it fall apart and the bone marrow butter is ridiculous.' People buy from enthusiasm, not information. Same with wine — don't just recommend by the glass, say 'if you're getting the steak, there's this Argentine Malbec that our sommelier paired with it and it's genuinely a perfect match.' You've just turned a $9 glass into a $45 bottle recommendation and you did it by being helpful, not pushy.",
          "Can we talk about the mental health side of this job? The combination of irregular sleep, irregular eating, constant social performance, and income instability takes a real toll. I've seen so many talented servers burn out or develop substance issues because the industry normalizes unhealthy coping mechanisms. After-shift drinks become nightly drinks become daily drinks. The adrenaline of a busy shift becomes the only thing that makes you feel alive, and your days off feel empty. If this sounds familiar, please talk to someone. Many restaurants now have employee assistance programs. And if you're a manager reading this: create a culture where your staff can be honest about struggling. Check in with your people. The cost of a supportive environment is nothing compared to constant turnover.",
          "The technology shift in restaurants is something I have complicated feelings about. QR code menus, tablet ordering, automatic tip suggestions — they all reduce the human interaction that makes dining out special. Yes, they improve efficiency. Yes, they reduce labor costs. But the tables where I connect with guests, read their mood, surprise them with a perfect recommendation they didn't know they wanted — those are the tables that leave 30% tips and become regulars. Technology can't replicate genuine hospitality. The restaurants that thrive long-term will be the ones that use technology to handle the administrative burden while freeing servers to do what we do best: make people feel welcome and cared for.",
          "Here's something for newer servers: learn the kitchen. Spend time talking to the cooks, understand how dishes are prepared, know the allergen risks, understand timing. When a table asks 'can you make this without garlic?' you should know instantly whether that's possible or if garlic is in the base sauce and it's a no-go. When someone asks how long their entrée will take, you should be able to read the ticket board and give an honest answer. This knowledge makes you better at your job and earns respect from the kitchen staff. The server-kitchen relationship is often adversarial, but the best restaurants are the ones where front-of-house and back-of-house operate as one team. Buy the kitchen a round of drinks sometimes. They work harder than anyone in the building."
        ],
        Chicago: [
          "Been here fifteen years and the neighborhood advice is crucial. Chicago is really a city of neighborhoods and picking the wrong one for your lifestyle can make you hate a city you'd otherwise love. If you're in your twenties and want nightlife: Wicker Park, Logan Square, or Lincoln Park. If you want quiet and family-friendly: Beverly, Edison Park, or North Center. If you want diversity and amazing food: Albany Park, Uptown, or Rogers Park. If you want hip and artsy: Pilsen or Bridgeport. Each neighborhood has its own personality, and moving between them feels like moving to a different city. Spend a full weekend in any neighborhood before signing a lease — walk around Saturday morning AND Friday night to see both sides.",
          "The winter survival guide needs more emphasis because people truly underestimate it. I'm from Minnesota so I thought I could handle it, but Chicago winter is different because of the wind. The wind chill regularly makes it feel like -30°F and it cuts through anything that isn't properly layered. My system: merino wool base layer (not cotton — cotton kills), fleece or down mid-layer, windproof outer shell. For your face: a balaclava or neck gaiter is essential, not optional. For your hands: mittens over gloves always. And here's what nobody mentions: your phone battery dies fast in extreme cold. Keep it in an inner pocket close to your body heat. Plan your routes to minimize time in the wind. Walk on the south side of east-west streets when the wind is from the north. These small strategies make the difference between surviving winter and being miserable.",
          "The food scene here genuinely rivals any city in the world and it's criminal how underrated it is. Everyone fixates on deep dish (which, for the record, is a special occasion food — Chicagoans eat thin crust for everyday pizza). But the real treasures: the taquerias along 26th Street in Little Village where a $3 taco is better than anything you'll get in most cities for $15. The Korean restaurants on Lawrence Ave. The Bosnian food in the far north. The soul food on the South Side — check out Virtue in Hyde Park or Lem's BBQ for rib tips that will change your understanding of barbecue. And Chicago's fine dining scene competes with NYC at literally half the price. A tasting menu at Smyth or Oriole is world-class and a fraction of what you'd pay at comparable restaurants in Manhattan.",
          "Public transit advice from someone who's been CTA-dependent for a decade: the system is genuinely good by American standards but has real limitations. The L covers the north side extremely well but south and west side coverage is spotty. Express buses during rush hour are often faster than trains. The Metra commuter rail is excellent if you're going between downtown and specific suburbs. Get the Transit app — it aggregates CTA, Metra, and Pace bus data better than the CTA's own app. For biking: Divvy (bike share) is fantastic April through October, and the lakefront trail is one of the great urban bike paths in America. But know that winter biking here requires studded tires and a death wish. Most people go CTA-only November through March.",
          "The cost of living conversation is nuanced. Yes, Chicago is cheaper than NYC, SF, or LA. But it's not cheap. A one-bedroom in a desirable neighborhood runs $1,400-2,000. Property taxes are infamously high. The sales tax is over 10%. That said, the value proposition is strong: you get genuine big-city amenities — world-class museums (many with free days), incredible parks, diverse food, professional sports, vibrant arts scene — at a price point where you can actually save money and have a life. I moved here from San Francisco and my quality of life improved dramatically even though my salary dropped 15%. I have a larger apartment, I eat out regularly, I go to shows, and I still save more than I did in the Bay Area."
        ],
        Cancer: [
          "Going through treatment right now and this is exactly what I needed to read. The thing about accepting help was the hardest for me. I've always been the strong one, the person everyone else leans on. Having to let people bring me meals, drive me to appointments, and see me at my worst felt like losing a core part of my identity. My therapist helped me reframe it: accepting help isn't weakness — it's giving the people who love you a way to show that love when they feel helpless. They WANT to do something. Letting them cook or clean or drive gives them purpose during a time when everyone feels powerless. I started keeping a list on my fridge of specific tasks people could do, and it made it easier for both sides. 'I need someone to pick up my prescription Tuesday' is more actionable than 'let me know if you need anything.'",
          "The scanxiety piece needs its own dedicated discussion because it never fully goes away, even years after treatment ends. I'm five years out and I still get knots in my stomach for a week before every scan. What's helped: acknowledging the anxiety instead of fighting it. Telling myself 'of course you're anxious, this is scary' instead of 'stop being dramatic, you're fine.' Planning something enjoyable immediately after the scan as a reward. And having a support person who just sits with you — not someone who tries to reassure you with 'I'm sure it'll be fine,' but someone who says 'this is hard and I'm here regardless of the results.' Also, talk to your oncologist about scan anxiety specifically. Some prescribe short-term anti-anxiety medication for scan days and there's no shame in using it.",
          "I'm a caregiver (my wife was diagnosed 18 months ago) and the section about caregivers mattering too hit me hard. Nobody asks how the caregiver is doing. The focus is entirely on the patient, which it should be, but caregivers are drowning silently. I manage her medications, drive to every appointment, handle insurance paperwork, coordinate family communication, maintain the household, work full-time, AND try to be emotionally supportive 24/7. I haven't had a full night's sleep in months and I can't express frustration because 'at least I'm not the one with cancer.' The caregiver support groups helped enormously. Being in a room with people who understand that you can simultaneously be grateful your spouse is alive AND exhausted and resentful of the situation — that duality that nobody else gets — is profoundly validating.",
          "Nutrition during treatment is something I researched extensively and here's what I landed on: forget the miracle cancer-fighting diets you see online. The goal during chemo is simply to eat enough to maintain weight and energy. Your taste buds will change — things you loved will taste metallic or wrong. Eat whatever sounds good, whenever you can. For me, that was plain rice, popsicles, and scrambled eggs for weeks. My oncology dietitian was way more useful than any book. She suggested ginger tea for nausea (it works), protein shakes for days I couldn't eat solid food, and small frequent meals instead of three big ones. Stay hydrated above all else — dehydration makes every side effect worse. And don't let anyone guilt you about eating 'clean' during treatment. Keeping calories in your body is the priority.",
          "The financial toxicity of cancer is a term that oncologists are finally starting to use and it needs more attention. Even with good insurance, my out-of-pocket costs exceeded $15,000 in the first year. Parking at the cancer center alone was $25 per visit, three times a week. The medications that insurance 'covered' still had $500 copays. I had to reduce my work hours, so income dropped while expenses skyrocketed. What saved us: the hospital's financial counselor connected us to three different assistance programs I never knew existed. One covered copays for my specific drug. Another provided gas cards for transportation to treatment. A third offered a grant for living expenses. Ask your cancer center about financial navigation services — most major centers have them and they can find money you didn't know was available."
        ],
      };

      function getGenericComments(topicName: string): string[] {
        return [
          `This is such an important perspective on ${topicName}. I've been dealing with this for years and what I've found is that the conventional advice only gets you about 70% of the way there. The remaining 30% comes from personal experience and adaptation. What worked for me was starting with the standard approach and then systematically adjusting based on what I observed in my own situation. Everyone's circumstances are different, so the cookie-cutter advice from most guides will need modification. The key is to keep a journal or notes about what you're trying and what results you're seeing. Over time, patterns emerge that are unique to your situation and those patterns become your real guide. I spent six months refining my approach this way and the difference was night and day compared to just following generic recommendations.`,
          `I respectfully disagree with part of this, and I think the nuance matters. While the overall direction is right, there's a middle ground that gets overlooked in these discussions. In my experience, the extreme positions on either side of this topic both have merit, but the practical reality is somewhere in between. When I first started exploring ${topicName}, I went all-in on one approach and it backfired. Then I swung to the opposite extreme and that didn't work either. What finally clicked was taking elements from both philosophies and creating a hybrid approach that fit my specific circumstances. I think we do a disservice to newcomers when we present things as black-and-white because real life is messy and complicated. The best advice acknowledges that complexity instead of pretending there's one right answer.`,
          `Thank you for writing this out so thoroughly. I've shared this with three friends who are all dealing with ${topicName} in different ways and every one of them found it valuable. The part about the mental and emotional side really resonated — most resources focus entirely on the practical steps and ignore the psychological component, which in my experience is actually the harder part to navigate. I went through a period where I knew exactly what I should be doing but couldn't bring myself to do it because of fear, doubt, and overthinking. What broke the cycle was finding a mentor who had been through the same thing and could normalize the emotional roller coaster. Having someone say 'yeah, that's completely normal and here's how I got through it' was more helpful than any how-to guide I'd read.`,
          `Coming at this from a slightly different angle — I think the timing aspect doesn't get discussed enough. When you encounter ${topicName} matters enormously in terms of how you process it and what strategies work. If you're dealing with this early in your journey, the approach is fundamentally different than if you've been at it for years. I made the mistake of applying advanced strategies when I was still a beginner, which led to frustration and self-doubt. Conversely, once I had more experience, the beginner-level advice felt patronizing and unhelpful. The missing piece in most discussions about ${topicName} is a clear framework for where you are in your journey and what's appropriate for that stage. Not everyone is starting from zero, but not everyone is advanced either, and the advice should reflect that spectrum.`,
          `What I appreciate most about this discussion is the honesty. Too many forums and communities around ${topicName} are echo chambers where everyone agrees with the prevailing wisdom and dissent is discouraged. The reality is that this is a complex topic with legitimate debate and multiple valid approaches. I've tried three different strategies over the past two years and all of them had merits and drawbacks. The first one was faster but less sustainable. The second was thorough but incredibly time-consuming. The third was a good compromise but required resources not everyone has access to. What I ultimately settled on was a seasonal rotation: I use different approaches at different times based on my energy level, available time, and current priorities. This flexible framework has been far more effective than rigidly committing to any single method.`,
        ];
      }

      const commentBatch: { post_id: string; author_id: string; content: string; created_at: string }[] = [];
      const postCommentCounts: Record<string, number> = {};

      for (const post of allPosts) {
        const commentTemplates = topicCommentTemplates[post.topic_name] || getGenericComments(post.topic_name);
        const numComments = 3 + (Math.abs(hashString(post.id)) % 3);

        for (let c = 0; c < numComments; c++) {
          let commentUserIndex = (Math.abs(hashString(post.id + c.toString())) % userIds.length);
          if (userIds[commentUserIndex] === post.author_id) {
            commentUserIndex = (commentUserIndex + 1) % userIds.length;
          }

          const templateIndex = c % commentTemplates.length;
          const daysAgo = Math.abs(hashString(post.id + c.toString() + "t")) % 21;
          const hoursAgo = Math.abs(hashString(post.id + c.toString() + "h")) % 24;
          const commentDate = new Date();
          commentDate.setDate(commentDate.getDate() - daysAgo);
          commentDate.setHours(commentDate.getHours() - hoursAgo);

          commentBatch.push({
            post_id: post.id,
            author_id: userIds[commentUserIndex],
            content: commentTemplates[templateIndex],
            created_at: commentDate.toISOString(),
          });

          postCommentCounts[post.id] = (postCommentCounts[post.id] || 0) + 1;
        }

        // Insert in batches of 50
        if (commentBatch.length >= 50) {
          const batch = commentBatch.splice(0, 50);
          const { error: commentError } = await supabase.from("comments").insert(batch);
          if (commentError) {
            console.error("Error inserting comments:", commentError);
            throw commentError;
          }
          totalComments += batch.length;
        }
      }

      // Insert remaining comments
      if (commentBatch.length > 0) {
        const { error: commentError } = await supabase.from("comments").insert(commentBatch);
        if (commentError) throw commentError;
        totalComments += commentBatch.length;
      }

      // Update comment counts on posts in batches
      console.log("Updating comment counts...");
      const countEntries = Object.entries(postCommentCounts);
      for (let i = 0; i < countEntries.length; i++) {
        const [postId, count] = countEntries[i];
        await supabase.from("posts").update({ comment_count: count }).eq("id", postId);
      }

      console.log(`Comments done: ${totalComments}`);
    } // end comments mode

    console.log(`Done! Posts: ${totalInserted}, Comments: ${totalComments}`);

    return new Response(
      JSON.stringify({ success: true, totalInserted, totalComments }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
