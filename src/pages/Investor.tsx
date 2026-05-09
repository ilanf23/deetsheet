import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSitePages } from "@/hooks/useSitePages";

const SLUGS = ["investor_why", "investor_looking_for", "investor_contact"];

const Investor = () => {
  const { get } = useSitePages(SLUGS);
  const why = get("investor_why");
  const looking = get("investor_looking_for");
  const contact = get("investor_contact");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
          Become an Investor
        </h1>
        <p className="text-muted-foreground mb-8">
          Help us build the world's most trusted community knowledge platform.
        </p>

        {[why, looking, contact].map((section, i) => (
          <Card key={i} className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </main>
      <DeetFooter />
    </div>
  );
};

export default Investor;
