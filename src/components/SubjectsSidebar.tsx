import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Briefcase,
  Building2,
  Activity,
  Clock,
  Cake,
  Package,
  Map,
  Globe,
  GraduationCap,
  BookOpen,
  PartyPopper,
  Trophy,
  Users,
  Flag,
  Sparkles,
  PawPrint,
  UsersRound,
  Palette,
  Star,
  CalendarDays,
  School,
  Building,
  Store,
  ChevronRight,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { subjectCategories, getTopicsByCategory } from "@/data/seedData";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Life: Heart,
  Jobs: Briefcase,
  Cities: Building2,
  Health: Activity,
  Decades: Clock,
  Ages: Cake,
  Products: Package,
  States: Map,
  Countries: Globe,
  Colleges: GraduationCap,
  Majors: BookOpen,
  Holidays: PartyPopper,
  Sports: Trophy,
  Teams: Users,
  Nationalities: Flag,
  Religions: Sparkles,
  Pets: PawPrint,
  Clubs: UsersRound,
  Hobbies: Palette,
  Fanclubs: Star,
  Events: CalendarDays,
  Schools: School,
  Companies: Building,
  "Local Businesses": Store,
};

interface CategoryRowProps {
  category: string;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
}

const CategoryRow = ({ category, icon: Icon, expanded, onToggle }: CategoryRowProps) => {
  const catTopics = getTopicsByCategory(category);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm transition-colors w-full text-primary text-left hover:bg-muted ${
          expanded ? "font-semibold" : ""
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={expanded ? 2.25 : 1.75} />
        <span className="flex-1 truncate">{category}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {expanded && (
        <ul className="mt-1 mb-2 ml-9 pl-3 space-y-0.5">
          {catTopics.map((topic) => (
            <li key={topic.id}>
              <Link
                to={`/topic/${encodeURIComponent(topic.name)}`}
                className="block px-3 py-1.5 text-sm rounded-md text-primary hover:bg-muted hover:underline truncate"
              >
                {topic.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to={`/topics?category=${encodeURIComponent(category)}`}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md text-primary hover:bg-muted hover:underline"
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="truncate">View more</span>
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
};

const SubjectsSidebar = () => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(subjectCategories));

  const toggle = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <nav className="space-y-0.5">
      <h2 className="flex items-center h-8 px-3 pb-2 mb-2 border-b border-border">
        <Link
          to="/topics"
          className="text-[11px] font-heading font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          Subjects
        </Link>
      </h2>

      {subjectCategories.map((cat) => (
        <CategoryRow
          key={cat}
          category={cat}
          icon={CATEGORY_ICONS[cat] ?? Sparkles}
          expanded={expanded.has(cat)}
          onToggle={() => toggle(cat)}
        />
      ))}
    </nav>
  );
};

export default SubjectsSidebar;
