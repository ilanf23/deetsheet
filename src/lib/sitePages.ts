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
      "Below are some inspirations on how to come up with post ideas.",
  },
  {
    slug: "inspiration_prompts",
    label: "Need Inspiration? — Idea prompts (list)",
    defaultTitle: "Idea Prompts",
    defaultContent:
      "What are the best and worst parts about this topic? For example, what are the best and worst parts about being a teacher?\n\nIf you could give advice to someone about this topic, what would it be?\n\nHave you ever wanted to complain about what customers/clients do? This is your time to do it!\n\nWhat makes this topic different than others? For example, what makes Chicago different than other cities? What happens in Chicago that doesn't happen somewhere else?",
  },
  {
    slug: "inspiration_note",
    label: "Need Inspiration? — Note",
    defaultTitle: "Good To Know",
    defaultContent:
      "Remember, you can always make a post anonymous. You can also make them public later as well. Also, once you make a post, you have the option to go back and edit it.",
  },
  {
    slug: "inspiration_guidelines",
    label: "Need Inspiration? — Helpful guidelines (list)",
    defaultTitle: "Below are some helpful guidelines.",
    defaultContent:
      "Make headlines punchy. Only use as few words as possible to explain your post.\n\nIs the post headline self-explanatory?\n\nAvoid using the name of the topic in the post.\n\nA period is only needed if it is a sentence (meaning it has a subject and a verb).\n\nDo not use exclamation points in headlines, but you can use them in comments.\n\nNo opinions. (For example: Dogs are the best pets.)",
  },
  {
    slug: "inspiration_comment",
    label: "Need Inspiration? — Include a Comment",
    defaultTitle: "Include a Comment",
    defaultContent:
      "It's not required, but please include a comment to explain your post. Maybe write a little history about it or include a personal story.",
  },
  {
    slug: "inspiration_photo",
    label: "Need Inspiration? — Include A Photo",
    defaultTitle: "Include A Photo",
    defaultContent:
      "Attaching a photo gives attention to your post and really helps engage the viewer.",
  },
  {
    slug: "inspiration_rank",
    label: "Need Inspiration? — Rank!",
    defaultTitle: "Rank!",
    defaultContent:
      "If you don't feel like posting, please rank other posts. It might get the creative juices flowing to post.",
  },
  {
    slug: "inspiration_closing",
    label: "Need Inspiration? — Closing",
    defaultTitle: "Thank You",
    defaultContent:
      "Thank you again for contributing to DeetSheet! Your thoughts could help others for a lifetime.",
  },
  {
    slug: "rules_intro",
    label: "Rules & Guidelines — Intro",
    defaultTitle: "Rules & Guidelines",
    defaultContent:
      "Every post is reviewed before it goes live. These guidelines explain what we look for.",
  },
  {
    slug: "rules_adjusted",
    label: "Rules & Guidelines — Why posts are adjusted (list)",
    defaultTitle: "Below are reasons why your post will be adjusted.",
    defaultContent:
      "Avoid personalization (Ex: I, me, you, yours, we, ours)\n\nAvoid gender (Ex: her, him, she, he, etc.)\n\nAvoid exact numbers (Ex: People call me 10 times a day — should be — people call me too many times a day.)\n\nCapitalize first word if it's a sentence. Otherwise, you can capitalize each word if it's a headline.\n\nAvoid using name of the topic in the post.\n\nPeriod at end if it's a sentence\n\nToo many words\n\nToo vague\n\nGrammar\n\nNo interjections\n\nWrong category\n\nNo opinions\n\nNo Slang",
  },
  {
    slug: "rules_rejected",
    label: "Rules & Guidelines — Why posts are not approved (list)",
    defaultTitle: "Below are reasons why a post or photo is not approved.",
    defaultContent:
      "Political\n\nSelf-promoting\n\nIncludes a link to dangerous landing page\n\nObscene or Vulgar\n\nMalicious or Hateful",
  },
  {
    slug: "rules_closing",
    label: "Rules & Guidelines — Closing",
    defaultTitle: "Thank You",
    defaultContent:
      "Thank you again for contributing to DeetSheet! Your thoughts could help others for a lifetime.",
  },
];


export const findSection = (slug: string) =>
  SITE_PAGE_SECTIONS.find((s) => s.slug === slug);
