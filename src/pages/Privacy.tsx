import { Link } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: March 9, 2026
        </p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p className="mb-2">
              We collect information you provide when creating an account, including your name and email address. We also collect:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Profile data</strong> — display name, avatar, and bio you choose to add</li>
              <li><strong>Usage data</strong> — posts, ratings, comments, and interactions with content</li>
              <li><strong>Device information</strong> — browser type, operating system, IP address, and general location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve DeetSheet; personalize your experience and surface relevant content; communicate with you about your account, updates, and new features; ensure the safety and integrity of the platform; and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. User-Generated Content</h2>
            <p>
              Posts, ratings, and comments you submit on DeetSheet are public by nature and visible to other users. Your display name and profile information may be shown alongside your content. Please do not share sensitive personal information in public posts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with trusted service providers who help us operate the platform (e.g., hosting, analytics), and when required by law, regulation, or legal process. We may also share aggregated, non-identifiable data for research or business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Cookies & Tracking</h2>
            <p>
              DeetSheet uses essential cookies to keep you logged in and to ensure the platform functions properly. We may also use analytics cookies to understand how users interact with the platform and to improve the experience. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights & Choices</h2>
            <p>
              You have the right to access, correct, or delete your personal information. You can update your profile and account details at any time through your profile settings. To request account deactivation or data deletion, please contact us. Depending on your jurisdiction, you may have additional rights under applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Data Security</h2>
            <p>
              We implement industry-standard security measures, including encryption in transit and at rest, to protect your personal information. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Children's Privacy</h2>
            <p>
              DeetSheet is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13 in compliance with COPPA. If we learn that we have collected information from a child under 13, we will take steps to delete that information promptly. If you believe a child under 13 has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of material changes by posting the updated policy on this page and updating the "Last updated" date. Your continued use of DeetSheet after changes are posted constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please visit our{" "}
              <Link to="/contact" className="text-primary hover:underline">
                Contact page
              </Link>{" "}
              or email us at{" "}
              <a href="mailto:support@deetsheet.com" className="text-primary hover:underline">
                support@deetsheet.com
              </a>.
            </p>
          </section>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default Privacy;
