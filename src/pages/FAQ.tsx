import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Link } from "react-router-dom";

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold font-heading text-foreground mb-8">
          Frequently Asked Questions
        </h1>

        <div className="space-y-6">
          <div>
            <p className="font-bold text-foreground">
              Can I make a post or comment without creating a{" "}
              <Link to="/profile-edit" className="underline text-primary">
                profile
              </Link>
              ?
            </p>
            <p className="text-muted-foreground mt-1">
              No. You must create a{" "}
              <Link to="/profile-edit" className="underline text-primary">
                profile
              </Link>{" "}
              in order to make a post or comment. There are many{" "}
              <Link to="/profile-edit" className="underline text-primary">
                advantages
              </Link>{" "}
              to creating an{" "}
              <Link to="/profile-edit" className="underline text-primary">
                account
              </Link>
              .
            </p>
          </div>

          <div>
            <p className="font-bold text-foreground">
              I would like to start a new topic or subject. How do I create it?
            </p>
            <p className="text-muted-foreground mt-1">
              At this time, topics and subjects are created by DeetSheet
              administrators. If you would like to suggest a new topic, please
              contact us and we will review your request.
            </p>
          </div>

          <div>
            <p className="font-bold text-foreground">
              I don't see my post. Has it been deleted?
            </p>
            <p className="text-muted-foreground mt-1">
              Posts that violate our community guidelines may be removed by
              moderators. If you believe your post was removed in error, please
              contact us for further assistance.
            </p>
          </div>

          <div>
            <p className="font-bold text-foreground">
              How do I email my post to friends?
            </p>
            <p className="text-muted-foreground mt-1">
              You can share any post by copying the link from your browser's
              address bar and pasting it into an email. We are working on adding
              a dedicated share-by-email feature in the future.
            </p>
          </div>

          <div>
            <p className="font-bold text-foreground">
              How do I upload my post to Facebook or Twitter?
            </p>
            <p className="text-muted-foreground mt-1">
              Currently, you can share your post on social media by copying the
              post link and pasting it into a new Facebook or Twitter post. A
              built-in social sharing feature is coming soon.
            </p>
          </div>

          <div>
            <p className="font-bold text-foreground">
              I don't agree with a post. Is there a way to have it removed?
            </p>
            <p className="text-muted-foreground mt-1">
              DeetSheet supports free expression and does not remove posts simply
              because someone disagrees with them. However, if a post violates
              our community guidelines, you can report it using the menu on the
              post and our moderation team will review it.
            </p>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default FAQ;
