import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import * as observationService from "../../services/observationService.js";
import { listDefectsByObservation } from "../../repositories/defectRepository.js";
import { AppError } from "../errors.js";
import {
  OBSERVATION_STATUSES,
  type ObservationStatus,
} from "../../domain/observation.js";
import type { AuthedRequest } from "../types.js";

const submitSchema = z.object({
  imageUrl: z.string().url(),
  location: z.object({ lng: z.number(), lat: z.number() }).optional(),
  assetId: z.string().uuid().optional(),
  note: z.string().max(2000).optional(),
});

function parseStatus(value: unknown): ObservationStatus | undefined {
  return typeof value === "string" &&
    (OBSERVATION_STATUSES as readonly string[]).includes(value)
    ? (value as ObservationStatus)
    : undefined;
}

export const observationRouter: Router = Router();

observationRouter.post(
  "/",
  requireAuth,
  validateBody(submitSchema),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const obs = await observationService.submitObservation({
      reporterId: req.auth!.sub,
      ...req.body,
    });
    res.status(202).json({ observation: obs });
  }),
);

observationRouter.get(
  "/",
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const isAuthority =
      req.auth!.role === "authority" || req.auth!.role === "admin";
    const list = await observationService.listObservations({
      // Citizens only ever see their own submissions.
      reporterId: isAuthority ? undefined : req.auth!.sub,
      assetId:
        typeof req.query.assetId === "string" ? req.query.assetId : undefined,
      status: parseStatus(req.query.status),
      limit: Number(req.query.limit ?? 50),
      offset: Number(req.query.offset ?? 0),
    });
    res.json({ observations: list });
  }),
);

observationRouter.get(
  "/:id",
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const obs = await observationService.getObservation(req.params.id);
    if (!obs) throw new AppError(404, "observation not found");
    const isOwner = obs.reporterId === req.auth!.sub;
    const isAuthority =
      req.auth!.role === "authority" || req.auth!.role === "admin";
    if (!isOwner && !isAuthority) throw new AppError(403, "forbidden");
    const defects = await listDefectsByObservation(obs.id);
    res.json({ observation: obs, defects });
  }),
);
