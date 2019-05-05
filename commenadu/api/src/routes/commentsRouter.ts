import { Router } from "express";
import { CommentController } from "../controllers/comment";
import { authJwt } from "../services/authJwt";

const commentsRouter = Router();

// Extending comments
commentsRouter.post("/", authJwt, CommentController.create);
commentsRouter.post("/like/:commentID", authJwt, CommentController.likeComment);

commentsRouter.put("/:commentID", authJwt, CommentController.update);

commentsRouter.delete("/:commentID", authJwt, CommentController.remove);

export default commentsRouter;
