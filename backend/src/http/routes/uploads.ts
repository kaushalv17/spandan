import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { objectKey, presignPut, publicUrl } from "../../infrastructure/storage.js";

const bodySchema = z.object({
  contentType: z.string().regex(/^image\/(jpe?g|png|webp)$/),
  ext: z.string().max(5).optional(),
});

export const uploadsRouter: Router = Router();

// Returns a short-lived PUT URL for the browser + the eventual public objectUrl.
uploadsRouter.post("/presign", requireAuth, async (req, res, next) => {
  try {
    const { contentType, ext } = bodySchema.parse(req.body);
    const key = objectKey(ext ?? contentType.split("/")[1]);
    const uploadUrl = await presignPut(key, contentType);
    res.json({ key, uploadUrl, objectUrl: publicUrl(key) });
  } catch (err) {
    next(err);
  }
});
