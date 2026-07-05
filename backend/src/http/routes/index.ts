import { Router } from "express";
import { authRouter } from "./auth.js";
import { assetRouter } from "./assets.js";
import { observationRouter } from "./observations.js";

export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/assets", assetRouter);
apiRouter.use("/observations", observationRouter);
