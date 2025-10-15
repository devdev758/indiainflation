/** @jest-environment node */

import type { NextApiRequest, NextApiResponse } from "next";

import handler from "@/pages/api/v1/search";

function createReqRes(query: Record<string, unknown>) {
  const req = {
    method: "GET",
    query,
  } as unknown as NextApiRequest;

  let statusCode = 200;
  let jsonPayload: unknown = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      jsonPayload = payload;
      return this;
    },
    setHeader: jest.fn(),
  } as unknown as NextApiResponse;

  return { req, res, getStatus: () => statusCode, getJson: () => jsonPayload };
}

describe("/api/v1/search integration stub", () => {
  beforeEach(() => {
    process.env.TYPESENSE_HOST = "http://typesense";
    process.env.TYPESENSE_API_KEY = "key";
  });

  it("returns at least one result for CPI all items", async () => {
    const typesensePayload = {
      hits: [
        {
          document: {
            id: "cpi-all-items",
            name: "CPI All Items",
            category: "cpi",
            last_index_value: 175.2,
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => typesensePayload,
    } as unknown as Response);

    const { req, res, getStatus, getJson } = createReqRes({ q: "cpi", type: "item" });

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const payload = getJson();
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).not.toHaveLength(0);
    expect(payload[0]).toMatchObject({ id: "cpi-all-items", name: "CPI All Items" });
  });
});
