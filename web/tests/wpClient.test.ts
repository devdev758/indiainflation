/** @jest-environment node */

import {
  __clearWpClientCache,
  fetchPostBySlug,
  fetchPosts,
  type PostSummary
} from "@/lib/wpClient";

const originalEnv = { ...process.env };

describe("wpClient", () => {
  beforeEach(() => {
    process.env.WP_API_BASE = "https://example.test/wp-json/";
    process.env.WP_ADMIN_USER = "user";
    process.env.WP_APP_PASSWORD = "pass";
    (global as any).fetch = jest.fn();
    __clearWpClientCache();
  });

  afterEach(() => {
    process.env.WP_API_BASE = originalEnv.WP_API_BASE;
    process.env.WP_ADMIN_USER = originalEnv.WP_ADMIN_USER;
    process.env.WP_APP_PASSWORD = originalEnv.WP_APP_PASSWORD;
    if (typeof (global as any).fetch?.mockReset === "function") {
      (global as any).fetch.mockReset();
    }
    __clearWpClientCache();
  });

  it("fetches posts with basic auth and maps response", async () => {
    const sampleResponse = [
      {
        id: 1,
        slug: "sample-post",
        title: { rendered: "Sample Post" },
        excerpt: { rendered: "<p>Summary</p>" },
        content: { rendered: "<p>Content</p>" },
        date: "2025-10-13T00:00:00",
        _embedded: {
          author: [{ id: 12, name: "Editorial Team" }],
          "wp:featuredmedia": [{ id: 55, source_url: "https://example.test/image.jpg", alt_text: "Alt" }],
          "wp:term": [[{ id: 9, taxonomy: "category", name: "Economy", slug: "economy" }]]
        }
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => sampleResponse
    });

    const posts = await fetchPosts({ per_page: 1 });

    expect(posts).toEqual<PostSummary[]>([
      {
        id: 1,
        slug: "sample-post",
        title: "Sample Post",
        excerpt: "<p>Summary</p>",
        date: "2025-10-13T00:00:00",
        author: "Editorial Team",
        featuredImage: "https://example.test/image.jpg",
        categories: [{ id: 9, name: "Economy", slug: "economy" }]
      }
    ]);

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe("Basic dXNlcjpwYXNz");
  });

  it("caches requests within the TTL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await fetchPosts({ per_page: 1, page: 1 });
    await fetchPosts({ per_page: 1, page: 1 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("supports rest_route based API URLs", async () => {
    process.env.WP_API_BASE = "https://example.test/index.php?rest_route=/";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await fetchPosts({ per_page: 2, page: 3 });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      "https://example.test/index.php?rest_route=%2Fwp%2Fv2%2Fposts&per_page=2&page=3&status=publish&_embed=author%2Cwp%3Afeaturedmedia%2Cwp%3Aterm"
    );
  });

  it("falls back to secondary base URL when the primary fails", async () => {
    process.env.WP_API_BASE = "https://unreachable.invalid,http://fallback.test/wp-json/";
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    await fetchPosts({ per_page: 1, page: 1 });

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe(
      "http://fallback.test/wp-json/wp/v2/posts?per_page=1&page=1&status=publish&_embed=author%2Cwp%3Afeaturedmedia%2Cwp%3Aterm"
    );
  });

  it("returns null when no post matches slug", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => []
    });

    const post = await fetchPostBySlug("missing");

    expect(post).toBeNull();
  });
});
