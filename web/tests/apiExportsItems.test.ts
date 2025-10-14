/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

import handler from "@/pages/api/exports/items/[slug]";

const EXPORT_DIR = path.join(process.cwd(), "etl", "data", "exports", "items");

type MockResponse = ReturnType<typeof createMockResponse>;

const originalS3Bucket = process.env.S3_BUCKET;
const originalS3Endpoint = process.env.S3_ENDPOINT;

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown
  };

  res.setHeader = (key: string, value: string) => {
    res.headers[key.toLowerCase()] = value;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: unknown) => {
    res.body = payload;
    return res;
  };
  res.send = (payload: unknown) => {
    res.body = payload;
    return res;
  };
  res.end = (payload?: unknown) => {
    if (payload !== undefined) {
      res.body = payload;
    }
    return res;
  };

  return res;
}

describe("GET /api/exports/items/[slug]", () => {
  const slug = "sample-item";
  const filePath = path.join(EXPORT_DIR, `${slug}.json.gz`);

  beforeAll(() => {
    process.env.S3_BUCKET = "";
    process.env.S3_ENDPOINT = "";
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    const payload = {
      slug,
      name: "Sample Item",
      metadata: {
        first_date: "2023-01-01",
        last_date: "2024-03-01",
        count: 3,
        last_index_value: 110,
        average_index_value: 105
      },
      series: [
        { date: "2023-01-01", index_value: 100, yoy_pct: null, mom_pct: null },
        { date: "2023-02-01", index_value: 104, yoy_pct: null, mom_pct: 4 },
        { date: "2024-03-01", index_value: 110, yoy_pct: 10, mom_pct: 1.5 }
      ]
    };
    const gz = gzipSync(Buffer.from(JSON.stringify(payload), "utf-8"));
    fs.writeFileSync(filePath, gz);
  });

  afterAll(() => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    process.env.S3_BUCKET = originalS3Bucket;
    process.env.S3_ENDPOINT = originalS3Endpoint;
  });

  it("returns parsed JSON from the gz export", async () => {
    const req = {
      method: "GET",
      query: { slug }
    } as any;
    const res: MockResponse = createMockResponse();

    await handler(req, res as any);

    expect(res.statusCode).toBe(200);
    expect((res.body as { slug: string }).slug).toBe(slug);
    expect(Array.isArray((res.body as { series: unknown[] }).series)).toBe(true);
  });
});
