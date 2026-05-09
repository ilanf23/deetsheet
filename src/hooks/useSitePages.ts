import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_PAGE_SECTIONS, findSection } from "@/lib/sitePages";

export interface SitePageRow {
  slug: string;
  title: string;
  content: string;
}

export function useSitePages(slugs: string[]) {
  const [pages, setPages] = useState<Record<string, SitePageRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("site_pages")
        .select("slug,title,content")
        .in("slug", slugs);
      if (!active) return;
      const map: Record<string, SitePageRow> = {};
      (data ?? []).forEach((row) => {
        map[row.slug] = row as SitePageRow;
      });
      setPages(map);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`site-pages-${slugs.join("-")}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_pages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as SitePageRow;
          if (!row || !slugs.includes(row.slug)) return;
          setPages((prev) => {
            if (payload.eventType === "DELETE") {
              const { [row.slug]: _, ...rest } = prev;
              return rest;
            }
            return { ...prev, [row.slug]: payload.new as SitePageRow };
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join("|")]);

  const get = (slug: string) => {
    const row = pages[slug];
    const def = findSection(slug);
    return {
      title: row?.title || def?.defaultTitle || "",
      content: row?.content || def?.defaultContent || "",
    };
  };

  return { get, loading };
}

export const allSiteSectionSlugs = SITE_PAGE_SECTIONS.map((s) => s.slug);
