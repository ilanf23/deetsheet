export interface SitePageSection {
  slug: string;
  label: string;
  defaultTitle: string;
  defaultContent: string;
}

export const SITE_PAGE_SECTIONS: SitePageSection[] = [
  {
    slug: "about_how_it_works",
    label: "About — How it works",
    defaultTitle: "How it works",
    defaultContent:
      "Explore!\nClick on various topics. There is a wealth of information under each heading. Maybe start with ones that most affect you. But then explore your horizons to learn about others. You may appreciate our similarities while also finding out what makes us different. Rate a posting to let others know how you feel.\n\nShare!\nAfter clicking on a topic, post a comment on how it relates to your life. Maybe it's funny or maybe it's serious. Either way, someone may enjoy reading your thoughts. If you have a comment to share but don't see a heading, create your own.\n\nLearn!\nThe more you explore the more you learn. Find out how others live. You may learn something that will help you later in life. Create a profile so you can keep track of your posts, comments, and favorites, while also communicating with others in the DeetSheet community.",
  },
  {
    slug: "about_how_it_started",
    label: "About — How it started",
    defaultTitle: "How it started",
    defaultContent:
      "The Beginning!\nMany years ago, I started writing down experiences in life that I wanted to appreciate more. The first entries included remembering forgotten moments from childhood and noticing how I was getting older. It was my way of appreciating small events—or in other words, stopping to smell the roses along the journey of life.\n\nA Bigger Idea!\nSoon after, I began to realize that many of these thoughts could benefit others who may be entering the same point in their life. These helpful tips could benefit a new parent, someone starting a new job, or even someone visiting a new city. Since I couldn't offer advice on every topic, I decided to create a website to help fill in the blanks.\n\nJoin In!\nPlease explore the site and learn from others. If you have a piece of advice to share, feel free to comment on an existing post or start your own. On this site, you are both the author and the reader.\n\nThank You!\nThank you again for visiting DeetSheet.com. Your few words could help others for a lifetime.",
  },
  {
    slug: "investor_why",
    label: "Investor — Why DeetSheet",
    defaultTitle: "Why DeetSheet?",
    defaultContent:
      "DeetSheet is reimagining how people share lived experience and practical wisdom. By combining ranked, long-form insights with a clean, community-first interface, we're creating a knowledge platform that gets more valuable with every contribution.\n\nWe're building across three core verticals — Life, Jobs, and Cities — each representing a massive market underserved by today's social and review platforms.",
  },
  {
    slug: "investor_looking_for",
    label: "Investor — What we're looking for",
    defaultTitle: "What We're Looking For",
    defaultContent:
      "We're connecting with mission-aligned investors and partners who believe in community-owned knowledge and long-term value creation.\n\n• Angel and seed-stage investors\n• Strategic partners in media, education, or local discovery\n• Operators who've scaled community-driven platforms",
  },
  {
    slug: "investor_contact",
    label: "Investor — Get in touch",
    defaultTitle: "Get in Touch",
    defaultContent:
      "Request our investor deck or schedule an intro call.\n\ninvest@deetsheet.com",
  },
  {
    slug: "inspiration_intro",
    label: "Need Inspiration? — Intro",
    defaultTitle: "Need Inspiration?",
    defaultContent:
      "Not sure what to post? You already know something that would help someone else. Use the prompts and tips below to find it.",
  },
  {
    slug: "inspiration_prompts",
    label: "Need Inspiration? — Posting prompts",
    defaultTitle: "Posting Prompts",
    defaultContent:
      "What do you wish someone had told you before your first day at your job?\n\nWhat is one thing every visitor to your city gets wrong?\n\nWhat small habit made a big difference in your life?\n\nWhat is a cost, rule, or step people never see coming?",
  },
  {
    slug: "inspiration_tips",
    label: "Need Inspiration? — Tips",
    defaultTitle: "Tips For A Strong Post",
    defaultContent:
      "Post one concrete, uncommon fact.\n\nNo opinions, no exclamation points, few words.\n\nRank what you know instead of what you guess.",
  },
  {
    slug: "rules_intro",
    label: "Rules & Guidelines — Intro",
    defaultTitle: "Rules & Guidelines",
    defaultContent:
      "DeetSheet is built to help people. Every post is reviewed before it goes live. These guidelines explain what we look for and why a post may be adjusted or rejected.",
  },
  {
    slug: "rules_rejected",
    label: "Rules & Guidelines — Why posts are rejected",
    defaultTitle: "Why A Post May Be Rejected",
    defaultContent:
      "Vulgar, hateful, or harassing language.\n\nSpam or promotional content.\n\nOff-topic posts submitted under the wrong subject.\n\nDuplicates of content that already exists.\n\nUnverified or misleading claims.",
  },
  {
    slug: "rules_adjusted",
    label: "Rules & Guidelines — Why posts are adjusted",
    defaultTitle: "Why A Post May Be Adjusted",
    defaultContent:
      "Light edits for spelling, grammar, or formatting.\n\nTightening a title so readers can find the post.\n\nTrimming wording so the insight stays short and clear.\n\nIf you do not like an adjusted version, you can delete the post from your profile.",
  },
];

export const findSection = (slug: string) =>
  SITE_PAGE_SECTIONS.find((s) => s.slug === slug);
