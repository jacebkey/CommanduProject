import { Request, Response } from "express";
import { Group, User } from "../entities";

export namespace GroupController {
    export async function create(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
        } else {
            let group = new Group();
            group = await group.save();
            await user.joinGroup(group.groupName);

            res.status(201).json({
                created: group,
                memberTo: await user.groups,
            });
        }
    }

    export async function joinGroup(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
        } else {
            if (!req.body.groupName) {
                res.status(400).json({ error: "No groupName argument provided." });
            }

            try {
                res.status(200).json({ user: await user.joinGroup(req.body.groupName) });
            } catch (error) {
                res.status(400)
                    .json({ error });
            }
        }
    }

    export async function leaveGroup(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
        } else {
            if (!req.body.groupName) {
                res.status(400).json({ error: "No groupName argument provided." });
            }

            try {
                res.status(200).json({ user: await user.leaveGroup(req.body.groupName) });
            } catch (error) {
                res.status(400)
                    .json({ error });
            }
        }
    }
}
