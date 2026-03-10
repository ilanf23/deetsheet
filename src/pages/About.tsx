import { useState } from "react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";

type Tab = "how-it-works" | "how-it-started";

const About = () => {
  const [activeTab, setActiveTab] = useState<Tab>("how-it-started");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("how-it-works")}
            className={`text-lg font-bold px-4 py-1.5 rounded transition ${
              activeTab === "how-it-works"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            How it works
          </button>
          <button
            onClick={() => setActiveTab("how-it-started")}
            className={`text-lg font-bold px-4 py-1.5 rounded transition ${
              activeTab === "how-it-started"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            How it started
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "how-it-works" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-foreground leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold mb-3">Explore!</h2>
              <p>
                Click on various topics. There is a wealth of information under
                each heading. Maybe start with ones that most affect you. But
                then explore your horizons to learn about others. You may
                appreciate our similarities while also finding out what makes us
                different. Rate a posting to let others know how you feel.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Share!</h2>
              <p>
                After clicking on a topic, post a comment on how it relates to
                your life. Maybe it's funny or maybe it's serious. Either way,
                someone may enjoy reading your thoughts. If you have a comment
                to share but don't see a heading, create your own. (Remember to
                always use the search tool to see if the topic has been
                previously posted.)
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Learn!</h2>
              <p>
                The more you explore the more you learn. Find out how others
                live. You may learn something that will help you later in life.
                Create a profile so you can keep track of your posts, comments,
                and favorites, while also communicating with others in the
                DeetSheet community.
              </p>
            </div>
          </div>
        )}

        {activeTab === "how-it-started" && (
          <div className="space-y-4 text-foreground leading-relaxed">
            <p>
              Many years ago, I started writing down experiences in life that I
              wanted to appreciate more. The first entries included remembering
              forgotten moments from childhood and noticing how I was getting
              older. It was my way of appreciating small events--or in other
              words, stopping to smell the roses along the journey of life.
            </p>
            <p>
              Soon after, I began to realize that many of these thoughts could
              benefit others who may be entering the same point in their life.
              These helpful tips could benefit a new parent, someone starting a
              new job, or even someone visiting a new city. Since I couldn't
              offer advice on every topic, I decided to create a website to help
              fill in the blanks. This way, people from all over the world could
              share their experiences so others could learn from them. I also
              created a ranking system so the best posts would appear at the top.
            </p>
            <p>
              Please explore the site and learn from others. If you have a piece
              of advice to share, feel free to comment on a existing post or
              start your own. On this site, you are the both the author and the
              reader. Write a small insight from your life and include a story
              where it feels appropriate.
            </p>
            <p>
              Thank you again for visiting DeetSheet.com. Your few words could
              help others for a lifetime.
            </p>
            <div className="text-right mt-6">
              <p className="font-semibold">Fredric Brewer</p>
              <p>DeetSheet Founder</p>
            </div>
            <div className="text-center mt-12 text-muted-foreground">
              <p className="italic">
                "What we do for ourselves dies with us. What we do for others
                and the world remains and is immortal."
              </p>
              <p className="mt-1">Albert Pine (English author, d.1851)</p>
            </div>
          </div>
        )}
      </main>
      <DeetFooter />
    </div>
  );
};

export default About;
