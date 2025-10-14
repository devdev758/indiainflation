import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from "node:child_process";
import { appendFile } from "node:fs/promises";
import { promisify } from "node:util";

const execAsync = promisify(exec);

type ResponseBody =
  | { ok: true; triggered: boolean }
  | { ok: false; triggered?: boolean; error?: string };

const triggerCommand =
  "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null deploy@188.245.150.69 'sudo systemctl start indiainflation-indexer.service'";

const WEBHOOK_LOG_PATH = "/app/logs/webhook.log";

function getSecret() {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("WEBHOOK_SECRET is not configured");
  }
  return secret;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  let secret: string;
  try {
    secret = getSecret();
  } catch (error) {
    console.error("Webhook misconfigured", error);
    return res.status(500).json({ ok: false, error: "Server misconfigured" });
  }

  const providedSecretHeader = req.headers["x-webhook-secret"];
  const providedSecret = Array.isArray(providedSecretHeader) ? providedSecretHeader[0] : providedSecretHeader;

  if (!providedSecret || providedSecret !== secret) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  let payload: { action?: string; slug?: string; post_id?: number };
  try {
    payload =
      typeof req.body === "string"
        ? (JSON.parse(req.body) as { action?: string; slug?: string; post_id?: number })
        : ((req.body ?? {}) as { action?: string; slug?: string; post_id?: number });
  } catch (parseError) {
    console.error("Invalid webhook payload", parseError);
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }

  const { action, slug } = payload;

  if (action !== "publish" || !slug) {
    return res.status(200).json({ ok: true, triggered: false });
  }

  try {
    try {
      await res.revalidate(`/${slug}`);
    } catch (revalidateError) {
      console.error(`Failed to revalidate path /${slug}`, revalidateError);
    }

    const { stdout, stderr } = await execAsync(triggerCommand);
    if (stdout) {
      console.log("Webhook trigger stdout:", stdout.trim());
    }
    if (stderr) {
      console.error("Webhook trigger stderr:", stderr.trim());
    }

    try {
      const timestamp = new Date().toISOString();
      await appendFile(WEBHOOK_LOG_PATH, `${timestamp} publish ${slug}\n`);
    } catch (logError) {
      console.error("Failed to append webhook log", logError);
    }

    return res.status(200).json({ ok: true, triggered: true });
  } catch (error) {
    console.error("Failed to trigger ETL/indexer", error);
    return res.status(500).json({ ok: false, triggered: false, error: "Trigger failed" });
  }
}
