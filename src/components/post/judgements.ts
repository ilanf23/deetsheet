import {
  SmilePlus, Frown, Angry, Cloud, Heart, LifeBuoy, Atom, Flame, Zap, Ban,
  Lightbulb, Sparkles, Palette, Check, X,
} from "lucide-react";
import type { ComponentType } from "react";

export type Judgement =
  | "Funny" | "Sad" | "Cruel" | "Reminiscent" | "Heartfelt"
  | "Helpful" | "Genius" | "Provocative" | "Crazy" | "Spam"
  | "Insightful" | "Erotic" | "Creative" | "Agree" | "Disagree";

export const JUDGEMENT_ICONS: Record<Judgement, ComponentType<{ className?: string }>> = {
  Funny: SmilePlus,
  Sad: Frown,
  Cruel: Angry,
  Reminiscent: Cloud,
  Heartfelt: Heart,
  Helpful: LifeBuoy,
  Genius: Atom,
  Provocative: Flame,
  Crazy: Zap,
  Spam: Ban,
  Insightful: Lightbulb,
  Erotic: Sparkles,
  Creative: Palette,
  Agree: Check,
  Disagree: X,
};

export const JUDGEMENT_ORDER: Judgement[] = [
  "Funny", "Helpful", "Insightful",
  "Sad", "Genius", "Erotic",
  "Cruel", "Provocative", "Creative",
  "Reminiscent", "Crazy", "Agree",
  "Heartfelt", "Spam", "Disagree",
];

export const MAX_JUDGEMENT_SELECTIONS = 3;
