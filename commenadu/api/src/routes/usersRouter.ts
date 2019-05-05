import { Router } from "express";
import validate from "express-validation";
import { UserController } from "../controllers/user";
import { authJwt } from "../services/authJwt";
import { authLocal } from "../services/authLocal";
import signup from "../validations/user";

const usersRouter = Router();

// Extending users
usersRouter.get("/:username", authJwt, UserController.show);
usersRouter.get("/lookup/:username", UserController.lookup);

usersRouter.post("/login", authLocal, UserController.login);
usersRouter.post("/signup", validate(signup), UserController.create);

usersRouter.put("/", authJwt, UserController.update);

usersRouter.delete("/", authJwt, UserController.remove);

export default usersRouter;
