import { Link } from "react-router-dom";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: March 9, 2026
        </p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using DeetSheet, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you may not use the platform. Your continued use of DeetSheet constitutes acceptance of any updates or changes to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. User Accounts</h2>
            <p>
              To access certain features of DeetSheet, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date. You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. User-Generated Content</h2>
            <p>
              You retain ownership of content you post on DeetSheet. By posting content, you grant DeetSheet a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute your content in connection with operating and improving the platform. You are solely responsible for the content you post and represent that you have the right to share it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Prohibited Content</h2>
            <p>
              You agree not to post content that contains or promotes: hate speech or discrimination based on race, gender, religion, sexual orientation, or other protected characteristics; harassment, bullying, or threats directed at individuals or groups; spam, phishing, or deceptive content; misinformation or deliberately false information; illegal activities or content that violates applicable laws; sexually explicit material involving minors; or malware, viruses, or other harmful code.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Ratings & Community Guidelines</h2>
            <p>
              DeetSheet's rating system is designed for honest, fair feedback. You agree not to manipulate ratings through fake accounts, coordinated voting, or any other deceptive means. Ratings should reflect genuine opinions. Attempts to game the system may result in removal of ratings and suspension of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Content Moderation</h2>
            <p>
              DeetSheet reserves the right to review, edit, or remove any content that violates these terms or our community guidelines at our sole discretion. We may use automated tools and human review to monitor content. While we strive to maintain a safe environment, we do not guarantee that all objectionable content will be identified or removed promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Intellectual Property</h2>
            <p>
              The DeetSheet name, logo, and all related branding, design elements, and technology are the property of DeetSheet and are protected by intellectual property laws. You may not use, reproduce, or distribute any DeetSheet trademarks or proprietary materials without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Termination</h2>
            <p>
              We may suspend or terminate your account at any time if you violate these terms, engage in prohibited conduct, or for any other reason at our discretion. Upon termination, your right to use DeetSheet ceases immediately. You may also delete your account at any time through your profile settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Disclaimers & Limitation of Liability</h2>
            <p>
              DeetSheet is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the platform will be uninterrupted, secure, or error-free. To the fullest extent permitted by law, DeetSheet shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify users of material changes by posting the updated terms on this page and updating the "Last updated" date. Your continued use of DeetSheet after changes are posted constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Contact</h2>
            <p>
              If you have questions about these Terms of Service, please visit our{" "}
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

export default Terms;
