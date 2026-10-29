import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useTopicByName } from "@/hooks/useSupabaseTopics";
import { useCanonicalTopicUrl } from "@/hooks/useCanonicalTopicUrl";
import { useParams } from "react-router-dom";

function TopicRoute() {
  const { topicName } = useParams();
  const { data: topic } = useTopicByName(topicName);
  useCanonicalTopicUrl(topic?.name);
  return <span>{topic?.name}</span>;
}

describe("legacy topic route replacement", () => {
  it.each([
    ["/topic/Lake%20Forest?size=25#recent", "/topic/lake-forest"],
    ["/topic/LAKE%20FOREST/post/market-square-ebf4061d?size=25#comments", "/topic/lake-forest/post/market-square-ebf4061d"],
  ])("replaces %s, preserves suffixes and does not add history", async (legacy, canonical) => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    client.setQueryData(["topics"], [{ id: "lake", name: "Lake Forest", postCount: 1, createdAt: "2026-04-23T00:00:00Z" }]);
    const router = createMemoryRouter([
      { path: "/", element: <span>Home</span> },
      { path: "/topic/:topicName", element: <TopicRoute /> },
      { path: "/topic/:topicName/post/:slug", element: <TopicRoute /> },
    ], { initialEntries: ["/", legacy], initialIndex: 1 });
    const view = render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
    await waitFor(() => expect(router.state.location.pathname).toBe(canonical));
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.location.search).toBe("?size=25");
    expect(router.state.location.hash).toBe(legacy.includes("#comments") ? "#comments" : "#recent");
    await act(() => router.navigate(-1));
    expect(router.state.location.pathname).toBe("/");
    view.unmount();
    client.clear();
  });
});