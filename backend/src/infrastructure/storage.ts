import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true, // required for MinIO
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

const publicReadPolicy = (bucket: string): string =>
  JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });

/** Create the bucket + public-read policy if missing. Safe to call on boot. */
export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    logger.info(`storage: created bucket ${env.S3_BUCKET}`);
  }
  try {
    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: env.S3_BUCKET,
        Policy: publicReadPolicy(env.S3_BUCKET),
      }),
    );
  } catch (err) {
    logger.warn({ err }, "storage: could not set public-read policy");
  }
}

export function objectKey(ext = "jpg"): string {
  const d = new Date();
  const clean = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `observations/${yyyy}/${mm}/${randomUUID()}.${clean}`;
}

export function publicUrl(key: string): string {
  const base = env.S3_PUBLIC_URL || `${env.S3_ENDPOINT}/${env.S3_BUCKET}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function presignPut(
  key: string,
  contentType: string,
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 900 },
  );
}
