import { useState } from "react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { useSitePages } from "@/hooks/useSitePages";

type Tab = "how-it-works" | "how-it-started";

const SLUGS = ["about_how_it_works", "about_how_it_started"];

const About = () => {
  const [activeTab, setActiveTab] = useState<Tab>("how-it-started");
  const { get } = useSitePages(SLUGS);

  const works = get("about_how_it_works");
  const started = get("about_how_it_started");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("how-it-works")}
            className={`text-lg font-bold px-4 py-1.5 rounded transition ${
              activeTab === "how-it-works"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {works.title || "How it works"}
          </button>
          <button
            onClick={() => setActiveTab("how-it-started")}
            className={`text-lg font-bold px-4 py-1.5 rounded transition ${
              activeTab === "how-it-started"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {started.title || "How it started"}
          </button>
        </div>

        {activeTab === "how-it-works" && (
          <div className="text-foreground leading-relaxed whitespace-pre-wrap">
            {works.content}
          </div>
        )}

        {activeTab === "how-it-started" && (
          <div className="text-foreground leading-relaxed whitespace-pre-wrap">
            {started.content}
          </div>
        )}
      </main>
      <DeetFooter />
    </div>
  );
};

export default About;
