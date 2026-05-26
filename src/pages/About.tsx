import { useState } from "react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { useSitePages } from "@/hooks/useSitePages";

type Tab = "how-it-works" | "how-it-started";

const SLUGS = ["about_how_it_works", "about_how_it_started"];

const renderPageContent = (content: string | undefined) => {
  if (!content) return null;
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="text-foreground leading-relaxed space-y-4">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {block}
        </p>
      ))}
    </div>
  );
};

const About = () => {
  const [activeTab, setActiveTab] = useState<Tab>("how-it-works");
  const { get } = useSitePages(SLUGS);

  const works = get("about_how_it_works");
  const started = get("about_how_it_started");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("how-it-works")}
            className={`text-lg font-heading font-bold px-4 py-1.5 rounded transition ${
              activeTab === "how-it-works"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {works.title || "How it works"}
          </button>
          <button
            onClick={() => setActiveTab("how-it-started")}
            className={`text-lg font-heading font-bold px-4 py-1.5 rounded transition ${
              activeTab === "how-it-started"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {started.title || "How it started"}
          </button>
        </div>

        <div>
          {activeTab === "how-it-works" && renderPageContent(works.content)}
          {activeTab === "how-it-started" && (
            <>
              {renderPageContent(started.content)}
              <div className="mt-8 text-center text-foreground leading-relaxed">
                <p>Fredric Brewer</p>
                <p>DeetSheet Founder</p>
              </div>
              <blockquote className="mt-12 text-left text-muted-foreground">
                <p className="leading-relaxed">
                  &ldquo;What we do for ourselves dies with us. What we do for
                  others and the world remains and is immortal.&rdquo;
                </p>
                <footer className="mt-1 leading-relaxed">
                  Albert Pine (English author, d.1851)
                </footer>
              </blockquote>
            </>
          )}
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default About;
