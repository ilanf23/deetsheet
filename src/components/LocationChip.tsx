import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "@/contexts/LocationContext";
import { US_STATES } from "@/lib/usStates";
import { useToast } from "@/hooks/use-toast";

/**
 * The location chip lives in the header. It either shows the visitor's
 * current city/state or a "Set location" call-to-action. Clicking opens
 * a modal where the user can save, change, or clear their location.
 */
const LocationChip = () => {
  const { location, setLocation, clearLocation } = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form whenever the dialog opens or the active location changes.
  useEffect(() => {
    if (open) {
      setCity(location?.city ?? "");
      setState(location?.state ?? "");
    }
  }, [open, location]);

  const handleSave = async () => {
    if (!city.trim() || !state) {
      toast({
        title: "City and state required",
        description: "Please enter a city and pick a state.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const result = await setLocation(city, state);
    setSaving(false);
    if (!result) {
      toast({
        title: "Couldn't save location",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Location updated", description: `${result.city}, ${result.state}` });
    setOpen(false);
  };

  const handleClear = async () => {
    await clearLocation();
    toast({ title: "Location cleared", description: "Showing trending content nationally." });
    setOpen(false);
  };

  const label = location ? `${location.city}, ${location.state}` : "Set location";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={location ? "Change your location" : "Set your location"}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors max-w-[180px]"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your location</DialogTitle>
            <DialogDescription>
              Posts from your city show up first. You can change or clear this any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="loc-city">City</Label>
              <Input
                id="loc-city"
                placeholder="e.g. Chicago"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-state">State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger id="loc-state">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            {location && (
              <Button variant="ghost" onClick={handleClear} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LocationChip;
