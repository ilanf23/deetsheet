const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mode, linkedinUrl, content } = await req.json();

    let profileText = "";

    if (mode === "url") {
      // Validate URL
      if (
        !linkedinUrl ||
        !linkedinUrl.includes("linkedin.com/in/")
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid LinkedIn URL. Must contain linkedin.com/in/",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const res = await fetch(linkedinUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
        });

        const html = await res.text();

        if (
          html.includes("authwall") ||
          html.includes("sign-in") ||
          res.url.includes("authwall")
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              fallback: "paste",
              error:
                "LinkedIn requires sign-in to view this profile. Please use the paste option instead.",
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        profileText = html;
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            fallback: "paste",
            error:
              "Could not fetch LinkedIn profile. Please use the paste option instead.",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } else if (mode === "paste") {
      if (!content || content.trim().length < 20) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Please paste more profile content.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      profileText = content;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid mode." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Anthropic Messages API
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API key not configured.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicRes = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: `You extract structured profile data from LinkedIn profile text. Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "name": "string or null",
  "city": "string or null",
  "state": "US 2-letter state abbreviation or null (must be one of: AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY)",
  "country": "string or null",
  "bio": "string or null - a brief professional summary",
  "education": "one of: grade-school, high-school, trade-school, bachelors, masters, doctorate, or null",
  "highSchool": "string or null",
  "college": "string or null - the most prominent university/college",
  "degree": "string or null - e.g. B.A., M.S., Ph.D.",
  "major": "string or null - field of study",
  "job": "string or null - current role and company",
  "credentials": "array of {icon, text} or null - professional achievements. icon must be one of: pencil, graduation, briefcase, award, eye. Map: work experience→briefcase, education→graduation, publications/writing→pencil, achievements/awards→award, stats/metrics→eye",
  "expertiseTopics": "array of strings or null - skills and areas of expertise"
}

Extract as much as you can from the provided text. For location, try to parse city/state/country from the location field. Set fields to null if not found.`,
          messages: [
            {
              role: "user",
              content: `Extract profile data from this LinkedIn content:\n\n${profileText.substring(0, 15000)}`,
            },
          ],
        }),
      }
    );

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse profile with AI.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicRes.json();
    const textBlock = anthropicData.content?.find(
      (b: { type: string }) => b.type === "text"
    );
    if (!textBlock) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No response from AI.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from the response (handle potential markdown code blocks)
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const profile = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("parse-linkedin error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
