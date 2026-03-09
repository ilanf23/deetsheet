import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is DeetSheet?",
    answer:
      "DeetSheet is a community-driven platform where users can share, rate, and discuss posts across a wide range of topics. Think of it as a collaborative knowledge board — anyone can contribute insights, and the best content rises to the top through community ratings.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Click the Sign Up button in the header. You can register with your email and a password, or sign in instantly with your Google account. Once registered you can start posting, commenting, and rating right away.",
  },
  {
    question: "How does the rating system work?",
    answer:
      "Every post can be rated on a star scale by community members. The average rating is displayed next to each post, and higher-rated posts are ranked higher within their topic. You can also see your own rating alongside the community average.",
  },
  {
    question: "What are topics?",
    answer:
      "Topics are categories that group related posts together. When you visit a topic page you'll see all posts ranked by their community rating. You can browse existing topics from the home page or discover new ones through the search bar.",
  },
  {
    question: "Can I edit or delete my posts?",
    answer:
      "Currently you can request an edit through the Report menu on any post. Full self-service editing and deletion is on our roadmap and will be available in a future update.",
  },
  {
    question: "How do I report inappropriate content?",
    answer:
      "Click the three-dot menu (⋯) on any post and select from the report options — including junk, vulgar content, false information, and more. Check the relevant boxes and hit Send. Our moderation team reviews every report.",
  },
  {
    question: "What does 'Add to Favorites' do?",
    answer:
      "Favoriting a post saves it to your personal favorites list so you can quickly find it later. Click the three-dot menu on any post and choose 'Add to Favorites'.",
  },
  {
    question: "Is DeetSheet free to use?",
    answer:
      "Yes! DeetSheet is completely free. Creating an account, posting, commenting, and rating are all available at no cost.",
  },
  {
    question: "How can I contact the DeetSheet team?",
    answer:
      "You can reach us through the Contact link in the footer, or email us directly at support@deetsheet.com. We'd love to hear your feedback and suggestions.",
  },
  {
    question: "What are the community guidelines?",
    answer:
      "We expect all users to be respectful, post accurate information, and avoid spam or vulgar content. Posts that violate these guidelines may be removed after review. Full details are available on our Terms page.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground mb-8">
          Everything you need to know about DeetSheet.
        </p>

        <Accordion type="multiple" className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <DeetFooter />
    </div>
  );
};

export default FAQ;
