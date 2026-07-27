import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { useSitePages } from "@/hooks/useSitePages";

const SLUGS = [
  "inspiration_intro",
  "inspiration_prompts",
  "inspiration_note",
  "inspiration_guidelines",
  "inspiration_comment",
  "inspiration_photo",
  "inspiration_rank",
  "inspiration_closing",
];

const Inspiration = () => {
  const { get } = useSitePages(SLUGS);
  const intro = get("inspiration_intro");

  const lines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const sections: { slug: string; list: boolean }[] = [
    { slug: "inspiration_prompts", list: true },
    { slug: "inspiration_note", list: false },
    { slug: "inspiration_guidelines", list: true },
    { slug: "inspiration_comment", list: false },
    { slug: "inspiration_photo", list: false },
    { slug: "inspiration_rank", list: false },
    { slug: "inspiration_closing", list: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-3">{intro.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-10">{intro.content}</p>

        {sections.map(({ slug, list }) => {
          const section = get(slug);
          if (!section.title && !section.content) return null;
          return (
            <section key={slug} className="mb-10">
              <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
              {list ? (
                <ul className="space-y-3">
                  {lines(section.content).map((line, i) => (
                    <li
                      key={i}
                      className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground leading-relaxed"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                lines(section.content).map((line, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {line}
                  </p>
                ))
              )}
            </section>
          );
        })}
      </main>
      <DeetFooter />
    </div>
  );
};

export default Inspiration;
