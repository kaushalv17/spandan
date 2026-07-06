import { Router } from "express";
import { authRouter } from "./auth.js";
import { assetRouter } from "./assets.js";
import { observationRouter } from "./observations.js";
import { uploadsRouter } from "./uploads.js";

export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/uploads", uploadsRouter);
apiRouter.use("/assets", assetRouter);
apiRouter.use("/uploads", uploadsRouter);
apiRouter.use("/observations", observationRouter);
apiRouter.use("/uploads", uploadsRouter);
