import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { useSitePages } from "@/hooks/useSitePages";

const SLUGS = ["inspiration_intro", "inspiration_prompts", "inspiration_tips"];

const Inspiration = () => {
  const { get } = useSitePages(SLUGS);
  const intro = get("inspiration_intro");
  const prompts = get("inspiration_prompts");
  const tips = get("inspiration_tips");

  const paragraphs = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-3">{intro.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-10">{intro.content}</p>

        {[prompts, tips].map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
            <ul className="space-y-3">
              {paragraphs(section.content).map((line, i) => (
                <li
                  key={i}
                  className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground leading-relaxed"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <DeetFooter />
    </div>
  );
};

export default Inspiration;
