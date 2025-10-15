import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { createGunzip, createGzip } from "node:zlib";

import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const MAX_EXPORT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB safety cap

export type ItemExportData = {
  slug: string;
  name: string;
  metadata: {
    first_date: string | null;
    last_date: string | null;
    count: number;
    last_index_value: number | null;
    average_index_value: number | null;
  };
  default_region?: string;
  regions?: Array<{
    code: string;
    name: string;
    type: string;
  }>;
  regional_series?: Array<{
    code: string;
    name: string;
    type: string;
    metadata: {
      first_date: string | null;
      last_date: string | null;
      count: number;
      last_index_value: number | null;
      average_index_value: number | null;
    };
    series: Array<{
      date: string;
      index_value: number;
      yoy_pct: number | null;
      mom_pct: number | null;
    }>;
  }>;
  export_schema_version?: string;
  series: Array<{
    date: string;
    index_value: number;
    yoy_pct: number | null;
    mom_pct: number | null;
  }>;
};

type ExportSource = "local" | "s3" | "sample";

function hasPathProp(x: unknown): x is { path: string } {
  // Guard ensures candidate objects expose a string path when sourced locally
  return typeof x === "object" && x !== null && "path" in x && typeof (x as { path?: unknown }).path === "string";
}

export class ExportNotFoundError extends Error {
  constructor(message = "export not found") {
    super(message);
    this.name = "ExportNotFoundError";
  }
}

export class ExportTooLargeError extends Error {
  constructor(message = "export exceeds allowed size") {
    super(message);
    this.name = "ExportTooLargeError";
  }
}

function getLocalExportPath(slug: string): string {
  return path.join(process.cwd(), "etl", "data", "exports", "items", `${slug}.json.gz`);
}

function ensureSizeWithinLimits(size: number): void {
  if (size > MAX_EXPORT_SIZE_BYTES) {
    throw new ExportTooLargeError();
  }
}

function createS3Client(): S3Client | null {
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  if (!bucket || !endpoint) {
    return null;
  }

  return new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials:
      process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY
          }
        : undefined
  });
}

async function readAndGunzip(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const buffers: Buffer[] = [];

    const cleanup = () => {
      stream.removeAllListeners();
      gunzip.removeAllListeners();
    };

    gunzip.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      buffers.push(buffer);
      const total = buffers.reduce((sum, buf) => sum + buf.length, 0);
      if (total > MAX_EXPORT_SIZE_BYTES) {
        cleanup();
        stream.destroy();
        gunzip.destroy();
        reject(new ExportTooLargeError());
        return;
      }
    });

    gunzip.on("end", () => {
      cleanup();
      resolve(Buffer.concat(buffers).toString("utf-8"));
    });

    gunzip.on("error", (err) => {
      cleanup();
      reject(err);
    });

    stream.on("error", (err) => {
      cleanup();
      reject(err);
    });

    stream.pipe(gunzip);
  });
}

async function loadFromLocal(slug: string): Promise<{ buffer: Buffer; source: ExportSource; path: string } | null> {
  const fullPath = getLocalExportPath(slug);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const stat = await fsp.stat(fullPath);
  await ensureSizeWithinLimits(stat.size);
  const readStream = fs.createReadStream(fullPath);
  const jsonString = await readAndGunzip(readStream);
  return { buffer: Buffer.from(jsonString, "utf-8"), source: "local", path: fullPath };
}

async function loadFromS3(slug: string): Promise<{ buffer: Buffer; source: ExportSource } | null> {
  const client = createS3Client();
  const bucket = process.env.S3_BUCKET;
  if (!client || !bucket) {
    return null;
  }
  const key = `exports/items/${slug}.json.gz`;
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const size = head.ContentLength ?? 0;
    ensureSizeWithinLimits(size);
  } catch (error) {
    const name = (error as { name?: string }).name;
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (name === "NotFound" || name === "NoSuchKey" || status === 404) {
      return null;
    }
    if (error instanceof ExportTooLargeError) {
      throw error;
    }
  }

  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) {
      return null;
    }
    const bodyStream = response.Body as Readable;
    const jsonString = await readAndGunzip(bodyStream);
    return { buffer: Buffer.from(jsonString, "utf-8"), source: "s3" };
  } catch (error) {
    const name = (error as { name?: string }).name;
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (name === "NoSuchKey" || name === "NotFound" || status === 404) {
      return null;
    }
    throw error;
  }
}

async function loadFromSample(slug: string): Promise<{ buffer: Buffer; source: ExportSource } | null> {
  const samplePath = path.join(process.cwd(), "public", "sample-data", "items", `${slug}.json`);
  if (!fs.existsSync(samplePath)) {
    return null;
  }
  const data = await fsp.readFile(samplePath, "utf-8");
  return { buffer: Buffer.from(data, "utf-8"), source: "sample" };
}

export async function loadItemExport(slug: string, includeSample = true): Promise<{
  data: ItemExportData;
  source: ExportSource;
  rawBuffer: Buffer;
  localPath?: string;
}> {
  const candidates = [await loadFromLocal(slug), await loadFromS3(slug)];

  for (const candidate of candidates) {
    if (candidate) {
      const json = JSON.parse(candidate.buffer.toString("utf-8")) as ItemExportData;
      return {
        data: json,
        source: candidate.source,
        rawBuffer: candidate.buffer,
        localPath: hasPathProp(candidate) ? candidate.path : undefined
      };
    }
  }

  if (includeSample) {
    const sample = await loadFromSample(slug);
    if (sample) {
      const json = JSON.parse(sample.buffer.toString("utf-8")) as ItemExportData;
      return { data: json, source: "sample", rawBuffer: sample.buffer };
    }
  }

  throw new ExportNotFoundError();
}

export async function getGzipStreamForDownload(
  slug: string
): Promise<{ stream: Readable; source: ExportSource; contentLength?: number; filename: string }> {
  const localPath = getLocalExportPath(slug);
  if (fs.existsSync(localPath)) {
    const stat = await fsp.stat(localPath);
    await ensureSizeWithinLimits(stat.size);
    return {
      stream: fs.createReadStream(localPath),
      source: "local",
      contentLength: stat.size,
      filename: `${slug}.json.gz`
    };
  }

  const client = createS3Client();
  const bucket = process.env.S3_BUCKET;
  if (client && bucket) {
    const key = `exports/items/${slug}.json.gz`;
    try {
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (response.ContentLength) {
        ensureSizeWithinLimits(response.ContentLength);
      }
      if (response.Body) {
        return {
          stream: response.Body as Readable,
          source: "s3",
          contentLength: response.ContentLength,
          filename: `${slug}.json.gz`
        };
      }
    } catch (error) {
      const name = (error as { name?: string }).name;
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (name === "NoSuchKey" || name === "NotFound" || status === 404) {
        // continue to sample fallback
      } else {
        throw error;
      }
    }
  }

  const sample = await loadFromSample(slug);
  if (sample) {
    const gzip = createGzip();
    const readable = Readable.from([sample.buffer]);
    readable.pipe(gzip);
    return {
      stream: gzip,
      source: "sample",
      filename: `${slug}.json.gz`
    };
  }

  throw new ExportNotFoundError();
}

export async function convertExportToCsv(data: ItemExportData): Promise<string> {
  const header = "date,index_value,yoy_pct,mom_pct";
  const rows = data.series.map((entry) =>
    [
      entry.date,
      entry.index_value ?? "",
      entry.yoy_pct ?? "",
      entry.mom_pct ?? ""
    ]
      .map((value) => value.toString())
      .join(",")
  );
  return [header, ...rows].join("\n");
}

export async function loadSampleOnly(slug: string): Promise<ItemExportData | null> {
  const sample = await loadFromSample(slug);
  return sample ? (JSON.parse(sample.buffer.toString("utf-8")) as ItemExportData) : null;
}
