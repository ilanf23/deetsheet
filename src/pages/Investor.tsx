import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Investor = () => {
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

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Why DeetSheet?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-foreground leading-relaxed">
            <p>
              DeetSheet is reimagining how people share lived experience and practical
              wisdom. By combining ranked, long-form insights with a clean, community-first
              interface, we're creating a knowledge platform that gets more valuable with
              every contribution.
            </p>
            <p>
              We're building across three core verticals — Life, Jobs, and Cities — each
              representing a massive market underserved by today's social and review
              platforms.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">What We're Looking For</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              We're connecting with mission-aligned investors and partners who believe in
              community-owned knowledge and long-term value creation.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Angel and seed-stage investors</li>
              <li>Strategic partners in media, education, or local discovery</li>
              <li>Operators who've scaled community-driven platforms</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Request our investor deck or schedule an intro call.
            </p>
            <a
              href="mailto:invest@deetsheet.com?subject=Investor%20Inquiry"
              className="text-sm font-medium text-primary hover:underline"
            >
              invest@deetsheet.com
            </a>
          </CardContent>
        </Card>
      </main>
      <DeetFooter />
    </div>
  );
};

export default Investor;
