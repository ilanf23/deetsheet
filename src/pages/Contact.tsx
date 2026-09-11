import { useState } from "react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const contactCategories = [
  {
    title: "General Inquiries",
    description: "Questions about DeetSheet, how it works, or general feedback.",
  },
  {
    title: "Report a Problem",
    description: "Found a bug or something not working as expected? Let us know.",
  },
  {
    title: "Business & Partnerships",
    description: "Interested in partnering with DeetSheet or exploring business opportunities?",
  },
  {
    title: "Press",
    description: "Media inquiries, interview requests, or press-related questions.",
  },
];

const Contact = () => {
  const [presetCategory, setPresetCategory] = useState<string | undefined>();

  const chooseCategory = (title: string) => {
    setPresetCategory(title);
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
          Contact Us
        </h1>
        <p className="text-muted-foreground mb-8">
          We'd love to hear from you. Send us a message below and it goes straight to our team. We aim to respond within 24 to 48 hours.
        </p>

        <Card className="mb-8" id="contact-form">
          <CardHeader>
            <CardTitle className="text-lg">Send Us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm presetCategory={presetCategory} />
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold text-foreground mb-4">
          How Can We Help?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {contactCategories.map((cat) => (
            <Card key={cat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{cat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {cat.description}
                </p>
                <button
                  type="button"
                  onClick={() => chooseCategory(cat.title)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Send a Message
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Follow Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Stay up to date with the latest from DeetSheet on social media.
            </p>
            <div className="flex gap-4 text-sm font-medium text-primary">
              <a href="https://twitter.com/deetsheet" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Twitter
              </a>
              <a href="https://instagram.com/deetsheet" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Instagram
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
      <DeetFooter />
    </div>
  );
};

export default Contact;
