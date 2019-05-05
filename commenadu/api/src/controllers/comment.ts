import { Request, Response } from "express";
import { constants } from "../constants";
import { Highlight, ResponseComment, TopLevelComment, User } from "../entities";

export namespace CommentController {
    function validCreate(args: any): boolean {
        return (
            args.comment &&
            (args.topLevelCommentID ? !args.highlightID : args.highlightID)
        );
    }

    /**
     * Allows creation of a comment
     * Needs valid user and either parentID or highlightID, not both
     * @param req
     * @param res
     */
    export async function create(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
            return;
        }
        if (!validCreate(req.body)) {
            res.status(400).json({ error: "Invalid query arguments. Either comment, ID not provided or both topLevelCommentID and highlightID given." });
            return;
        }

        if (req.body.topLevelCommentID) {
            newResponseComment(req, res);
            return;
        } else {
            newTopLevelComment(req, res);
            return;
        }
    }

    export async function likeComment(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
            return;
        }
        if (!req.params.commentID) {
            res.status(400).json({ error: "Invalid query arguments." });
            return;
        }

        // Double get necessary if the first is undefined (only occurs in this case)
        let comment: TopLevelComment | ResponseComment | undefined = await TopLevelComment.findOne(req.params.commentID, { relations: ["author"] });
        comment = comment || await ResponseComment.findOne(req.params.commentID, { relations: ["author"] });
        if (!comment) {
            res.status(400).json({ error: `Comment with id ${req.params.commentID} does not exist.` });
        } else {
            if (comment.author.username === user.username) {
                res.status(400).json({ error: "A user cannot like their own comment." });
            } else {
                try {
                    comment.likes += await user.toggleLikeComment(comment.id);
                    await comment.save();
                    res.sendStatus(200);
                } catch {
                    res.sendStatus(500);
                }
            }
        }
    }

    async function newTopLevelComment(req: Request, res: Response): Promise<void> {
        let newComment = new TopLevelComment();
        newComment.text = req.body.comment;
        newComment.author = req.user;

        const highlight: Highlight | undefined = await Highlight.findOne(req.body.highlightID, { relations: ["viewingGroup"] });
        if (!highlight) {
            res.status(400)
                .json({ error: `Highlight does not exist with ID ${req.body.highlightID}.` });
            return;
        }
        newComment.highlight = highlight;

        // Check if the creating user belongs to the requested group
        if (req.body.groupName) {
            if (
                req.body.groupName !== highlight.viewingGroup.groupName ||
                !(await req.user.groupNames()).includes(highlight.viewingGroup.groupName)
            ) {
                res.status(400).json({
                    error: `User does not belong to group ${highlight.viewingGroup.groupName} or group name does not match parent or highlight.`,
                });
                return;
            }
        }

        try {
            newComment = await newComment.save();
            res.status(201).json({ newComment });
        } catch (e) {
            res.status(400)
                .json({ error: `Could not create new comment: ${e}.` });
        }
    }

    async function newResponseComment(req: Request, res: Response): Promise<void> {
        let newComment = new ResponseComment();
        newComment.text = req.body.comment;
        newComment.author = req.user;
        newComment.shoutOuts = [];

        let parent: TopLevelComment | undefined = await TopLevelComment.findOne(
            req.body.topLevelCommentID,
            { relations: ["highlight", "highlight.viewingGroup"] }
        );
        if (!parent) {
            const response = await ResponseComment.findOne(
                req.body.topLevelComment,
                {
                    relations: [
                        "topLevelComment",
                        "topLevelComment.highlight",
                        "topLevelComment.highlight.viewingGroup",
                    ],
                }
            );

            if (!response) {
                res.status(400)
                    .json({ error: `Parent comment does not exist with ID ${req.body.topLevelCommentID}.` });
                return;
            } else {
                parent = response.topLevelComment;
            }
        }
        newComment.topLevelComment = parent;

        // Check if the creating user belongs to the requested group
        if (req.body.groupName) {
            const highlight: Highlight | undefined = parent.highlight;
            if (!highlight) {
                res.status(400)
                    .json({ error: `Highlight does not exist with ID ${req.body.highlightID}.` });
                return;
            }
            if (
                req.body.groupName !== highlight.viewingGroup.groupName ||
                !(await req.user.groupNames()).includes(highlight.viewingGroup.groupName)
            ) {
                res.status(400).json({
                    error: `User does not belong to group ${highlight.viewingGroup.groupName} or group name does not match parent or highlight.`,
                });
                return;
            }
        }

        // Shoutouts must be an array of username strings
        if (Array.isArray(req.body.shoutOuts) && req.body.shoutOuts.length && req.body.shoutOuts[0] instanceof String) {
            const shoutOutUsernames: string[] = req.body.shoutOuts;
            for (const username of shoutOutUsernames) {
                const toShoutOut: User | undefined = await User.findOne({ where: { username } });
                if (toShoutOut) { newComment.shoutOuts.push(toShoutOut); }
            }
        }

        try {
            newComment = await newComment.save();
            res.status(201).json({ newComment });
        } catch (e) {
            res.status(400)
                .json({ error: `Could not create new comment: ${e}.` });
        }
    }

    /**
     * @param req expects: commentID in params, text in body
     * @param res gives: updated comment to display
     */
    export async function update(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
            return;
        }
        if (!req.params.commentID) {
            res.status(400).json({ error: "Nothing given to update." });
            return;
        }

        let comment: TopLevelComment | ResponseComment | undefined = await TopLevelComment.findOne(req.params.commentID, { relations: ["author"] });
        if (!comment) {
            comment = await ResponseComment.findOne(req.params.commentID, { relations: ["author"] });
        }
        if (!comment || comment.author !== user) {
            res.status(400).json({ error: "Comment does not exist or is not owned." });
        } else {
            if (req.body) {
                if (req.body.text) { comment.text = req.body.text; }
                await comment.save();
            }

            res.status(200).json({ comment });
        }
    }

    /**
     * @param req expects: commentID in params
     * @param res gives: updated comment to display
     */
    export async function remove(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (!user) {
            res.sendStatus(401);
            return;
        }
        if (!req.params.commentID) {
            res.status(400).json({ error: "Nothing given to delete." });
            return;
        }

        let comment: TopLevelComment | ResponseComment | undefined = await TopLevelComment.findOne(req.params.commentID, { relations: ["author"] });
        comment = comment || await ResponseComment.findOne(req.params.commentID, { relations: ["author"] });
        if (!comment || comment.author !== user) {
            res.status(400).json({ error: "Comment does not exist or is not owned." });
        } else {
            comment.author = await User.findOne({ where: { username: constants.DELETED_USER_USERNAME } });
            comment.text = constants.DELETED_COMMENT_TEXT;

            await comment.save();
            res.status(200).json({ comment });
        }
    }
}
