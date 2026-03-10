import { useState } from "react";
import { Linkedin, Loader2, ArrowLeft, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { LinkedInProfileData } from "@/types/linkedin";

interface LinkedInImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: LinkedInProfileData) => void;
}

const LinkedInImportDialog = ({
  open,
  onOpenChange,
  onImport,
}: LinkedInImportDialogProps) => {
  const [mode, setMode] = useState<"url" | "paste">("url");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState<LinkedInProfileData | null>(
    null
  );

  const reset = () => {
    setMode("url");
    setLinkedinUrl("");
    setPasteContent("");
    setLoading(false);
    setError("");
    setParsedData(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFetch = async () => {
    setError("");
    setLoading(true);

    try {
      const body =
        mode === "url"
          ? { mode: "url", linkedinUrl }
          : { mode: "paste", content: pasteContent };

      const { data, error: fnError } = await supabase.functions.invoke(
        "parse-linkedin",
        { body }
      );

      if (fnError) {
        setError("Failed to connect to the server. Please try again.");
        return;
      }

      if (!data.success) {
        if (data.fallback === "paste") {
          setMode("paste");
          setError(
            data.error ||
              "Could not fetch profile. Please paste your profile content instead."
          );
        } else {
          setError(data.error || "Failed to parse profile.");
        }
        return;
      }

      setParsedData(data.profile);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData);
      handleOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const renderPreview = () => {
    if (!parsedData) return null;

    const fields: { label: string; value: string | undefined }[] = [
      { label: "Name", value: parsedData.name },
      { label: "Location", value: [parsedData.city, parsedData.state, parsedData.country].filter(Boolean).join(", ") || undefined },
      { label: "Bio", value: parsedData.bio },
      { label: "Education Level", value: parsedData.education },
      { label: "High School", value: parsedData.highSchool },
      { label: "College", value: parsedData.college },
      { label: "Degree", value: parsedData.degree },
      { label: "Major", value: parsedData.major },
      { label: "Job", value: parsedData.job },
      {
        label: "Credentials",
        value: parsedData.credentials?.map((c) => c.text).join("; ") || undefined,
      },
      {
        label: "Expertise",
        value: parsedData.expertiseTopics?.join(", ") || undefined,
      },
    ];

    const nonEmpty = fields.filter((f) => f.value);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
          <Check className="h-4 w-4" />
          Profile parsed successfully
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {nonEmpty.map((f) => (
            <div key={f.label} className="text-sm">
              <span className="font-medium text-muted-foreground">
                {f.label}:
              </span>{" "}
              <span className="text-foreground">
                {f.value && f.value.length > 100
                  ? f.value.substring(0, 100) + "..."
                  : f.value}
              </span>
            </div>
          ))}
          {nonEmpty.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No fields could be extracted.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setParsedData(null)}
            className="gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={nonEmpty.length === 0}
            className="gap-1 flex-1"
          >
            <Linkedin className="h-3.5 w-3.5" />
            Import to Profile
          </Button>
        </div>
      </div>
    );
  };

  const renderInput = () => (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => { setMode("url"); setError(""); }}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "url"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          LinkedIn URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("paste"); setError(""); }}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "paste"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Paste Content
        </button>
      </div>

      {mode === "url" ? (
        <div className="space-y-2">
          <Input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://linkedin.com/in/yourname"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Only public profiles can be fetched. If it doesn't work, try the
            paste option.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Open your LinkedIn profile, select all (Ctrl+A / Cmd+A), copy (Ctrl+C / Cmd+C), and paste here..."
            rows={6}
            disabled={loading}
            className="resize-y"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="button"
        onClick={handleFetch}
        disabled={
          loading ||
          (mode === "url" && !linkedinUrl.trim()) ||
          (mode === "paste" && !pasteContent.trim())
        }
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing...
          </>
        ) : (
          <>
            <Linkedin className="h-4 w-4" />
            {mode === "url" ? "Fetch Profile" : "Parse Profile"}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5" />
            Import from LinkedIn
          </DialogTitle>
          <DialogDescription>
            Auto-fill your profile using your LinkedIn data.
          </DialogDescription>
        </DialogHeader>
        {parsedData ? renderPreview() : renderInput()}
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInImportDialog;
