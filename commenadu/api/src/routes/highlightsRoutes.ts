import { Router } from "express";
import { HighlightController } from "../controllers/highlight";
import { authJwt } from "../services/authJwt";

const highlightsRouter = Router();

// Extending highlights
// TODO: Maybe a hide, put with highlight id and track for the user, it will never be shown again

// No need for delete or update since there are a lot of potential children
highlightsRouter.get("/", authJwt, HighlightController.index);
highlightsRouter.get("/:highlightID", authJwt, HighlightController.show);

highlightsRouter.post("/", authJwt, HighlightController.create);

export default highlightsRouter;
