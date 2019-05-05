import { Router } from "express";
import commentsRouter from "./commentsRouter";
import groupsRouter from "./groupsRouter";
import highlightsRouter from "./highlightsRoutes";
import usersRouter from "./usersRouter";

const routes = Router();

/**
 * NOTE:
 * Post where create without known :id or identifier
 * Put where create on :id is known (also on update)
 * Get, Delete, etc. where normal (Delete may just hide an object where signified [local to just the requesting user])
 */
routes.use("/comments", commentsRouter);
routes.use("/groups", groupsRouter);
routes.use("/highlights", highlightsRouter);
routes.use("/users", usersRouter);

export default routes;
