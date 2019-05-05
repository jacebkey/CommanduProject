import { NextFunction, Request, Response } from "express";
import { Like } from "typeorm";
import { User } from "../entities";

export namespace UserController {
    export async function create(req: Request, res: Response): Promise<void> {
        let user = new User();
        user.username = req.body.username;
        user.email = req.body.email;
        user.password = req.body.password;

        try {
            user = await user.save();
            res.status(201).json({ newUser: await user.privateVersion() });
        } catch (e) {
            res.status(400).json({ error: `failure when creating user: ${e}.` });
        }
    }

    export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
        const user = req.user;
        res.status(200).json({ user: await user.privateVersion() });
        return next();
    }

    export async function lookup(req: Request, res: Response): Promise<void> {
        if (!req.params.username) {
            res.status(400).json({ error: "No username param given." });
        }

        res.status(200).json({
            users: await User.find({ where: { username: Like(`%${req.params.username}%`) } }),
        });
    }

    export async function remove(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
            return;
        }

        try {
            await user.remove();
            res.sendStatus(200);
        } catch (e) {
            res.sendStatus(500);
        }
    }

    /**
     * @param req expects :id for public get of user
     * @param res
     */
    export async function show(req: Request, res: Response): Promise<void> {
        if (!req.params.username) {
            res.status(400).json({ error: "No user username provided." });
            return;
        }

        const user: User | undefined = await User.findOne({ where: { username: req.params.username } });
        if (!user) {
            res.status(400).json({ error: `Could not find user with username: ${req.params.username}.` });
            return;
        }

        const authUser: User | undefined = req.user;
        if (authUser && authUser.username === req.params.username) {
            res.status(200).json({ user: user.privateVersion() });
        } else {
            res.status(200).json({ user: user.publicVersion() });
        }
    }

    /**
     * @param req expects: valid jwt in auth header, then fields relevant in req.body
     * @param res
     */
    export async function update(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
            return;
        }

        if (req.body) {
            if (req.body.username) { user.username = req.body.username; }
            if (req.body.email) { user.email = req.body.email; }
            if (req.body.password) { user.password = req.body.password; }

            await user.save();
        }

        res.status(200).json({ user: await user.privateVersion() });
    }
}
