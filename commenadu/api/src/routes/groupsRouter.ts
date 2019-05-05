import { Router } from "express";
import { GroupController } from "../controllers/group";
import { authJwt } from "../services/authJwt";

const groupsRouter = Router();

// Extending groups
groupsRouter.post("/create", authJwt, GroupController.create);
groupsRouter.post("/join", authJwt, GroupController.joinGroup);
groupsRouter.post("/leave", authJwt, GroupController.leaveGroup);

export default groupsRouter;
