import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import * as assets from "../../repositories/assetRepository.js";
import { healthHistory } from "../../repositories/healthRepository.js";
import { writeAudit } from "../../repositories/auditRepository.js";
import { getAssetPassport } from "../../services/passportService.js";
import { AppError } from "../errors.js";
import type { AssetType } from "../../domain/asset.js";
import type { AuthedRequest } from "../types.js";

const createAssetSchema = z.object({
  name: z.string().min(1),
  assetType: z.enum(["road", "bridge"]),
  location: z.object({ lng: z.number(), lat: z.number() }),
  address: z.string().optional(),
  importance: z.number().int().min(1).max(5).optional(),
  externalRef: z.string().optional(),
});

function parseAssetType(value: unknown): AssetType | undefined {
  return value === "road" || value === "bridge" ? value : undefined;
}

export const assetRouter: Router = Router();

assetRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await assets.listAssets({
      assetType: parseAssetType(req.query.assetType),
      limit: Number(req.query.limit ?? 50),
      offset: Number(req.query.offset ?? 0),
    });
    res.json({ assets: list });
  }),
);

assetRouter.post(
  "/",
  requireAuth,
  requireRole("authority", "admin"),
  validateBody(createAssetSchema),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const asset = await assets.createAsset({
      ...req.body,
      createdBy: req.auth!.sub,
    });
    await writeAudit({
      actorId: req.auth!.sub,
      action: "asset.create",
      entityType: "asset",
      entityId: asset.id,
    });
    res.status(201).json({ asset });
  }),
);

assetRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const passport = await getAssetPassport(req.params.id);
    res.json(passport);
  }),
);

assetRouter.get(
  "/:id/history",
  requireAuth,
  asyncHandler(async (req, res) => {
    const asset = await assets.getAssetById(req.params.id);
    if (!asset) throw new AppError(404, "asset not found");
    const history = await healthHistory(
      req.params.id,
      Number(req.query.limit ?? 100),
    );
    res.json({ assetId: asset.id, history });
  }),
);
