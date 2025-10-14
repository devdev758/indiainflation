/** @jest-environment node */

import type { NextApiRequest, NextApiResponse } from "next";

jest.mock("node:child_process", () => ({
  exec: jest.fn()
}));

jest.mock("node:fs/promises", () => ({
  appendFile: jest.fn().mockResolvedValue(undefined)
}));

import handler from "@/pages/api/webhooks/wp-publish";
import { exec } from "node:child_process";
import { appendFile } from "node:fs/promises";

const execMock = exec as jest.Mock;
const appendFileMock = appendFile as jest.Mock;

function createMockRes() {
  const res: Partial<NextApiResponse> & {
    body?: unknown;
    headers: Record<string, string>;
    revalidate: jest.Mock;
  } = {
    statusCode: 200,
    headers: {},
    revalidate: jest.fn().mockResolvedValue(undefined)
  };

  res.setHeader = (key: string, value: string) => {
    res.headers[key.toLowerCase()] = value;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res as NextApiResponse;
  };
  res.json = (payload: unknown) => {
    res.body = payload;
    return res as NextApiResponse;
  };

  return res as NextApiResponse & { body?: unknown; revalidate: jest.Mock };
}

describe("POST /api/webhooks/wp-publish", () => {
  const originalSecret = process.env.WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.WEBHOOK_SECRET = "test-secret";
    appendFileMock.mockResolvedValue(undefined);
    execMock.mockImplementation((command: string, optionsOrCallback: unknown, maybeCallback?: unknown) => {
      const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
      if (typeof callback === "function") {
        callback(null, { stdout: "ok", stderr: "" });
      }
    });
  });

  afterEach(() => {
    process.env.WEBHOOK_SECRET = originalSecret;
    execMock.mockReset();
    appendFileMock.mockReset();
  });

  it("rejects invalid secrets", async () => {
    const req = {
      method: "POST",
      headers: { "x-webhook-secret": "wrong" },
      body: { action: "publish" }
    } as Partial<NextApiRequest> as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ ok: false, error: "Unauthorized" });
    expect(execMock).not.toHaveBeenCalled();
  });

  it("triggers the ETL/indexer when action is publish", async () => {
    const req = {
      method: "POST",
      headers: { "x-webhook-secret": "test-secret" },
      body: { action: "publish", post_id: 1, slug: "sample" }
    } as Partial<NextApiRequest> as NextApiRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(execMock).toHaveBeenCalledTimes(1);
    expect(res.revalidate).toHaveBeenCalledWith("/sample");
    expect(appendFileMock).toHaveBeenCalledWith("/app/logs/webhook.log", expect.stringContaining("sample"));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, triggered: true });
  });
});
