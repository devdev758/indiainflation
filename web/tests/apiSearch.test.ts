/** @jest-environment node */

import type { NextApiRequest, NextApiResponse } from "next";

import handler from "@/pages/api/v1/search";

function createReqRes(query: Record<string, unknown>) {
  const req = {
    method: "GET",
    query,
  } as unknown as NextApiRequest;

  const json = jest.fn();
  const res = {
    status: jest.fn().mockReturnThis(),
    json,
    setHeader: jest.fn(),
  } as unknown as NextApiResponse;

  return { req, res, json };
}

describe("GET /api/v1/search", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns 400 when query is missing", async () => {
    const { req, res } = createReqRes({});

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing query" });
  });

  it("returns Typesense results", async () => {
    process.env.TYPESENSE_HOST = "http://typesense";
    process.env.TYPESENSE_API_KEY = "key";

    const payload = {
      hits: [
        {
          document: {
            id: "rice",
            name: "Rice",
            category: "grains",
            last_index_value: 120.5,
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as unknown as Response);

    const { req, res } = createReqRes({ q: "rice", type: "item" });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        id: "rice",
        name: "Rice",
        category: "grains",
        last_index_value: 120.5,
      },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/collections/items/documents/search"),
      expect.objectContaining({ method: "GET" })
    );
  });
});
