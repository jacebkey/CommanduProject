import { Request, Response } from "express";
import { Like } from "typeorm";
import { Group, Highlight, Site, TopLevelComment, User } from "../entities";

export namespace HighlightController {
    function validCreate(args: any): boolean {
        return (
            args.url &&
            args.text &&
            args.index >= 0
        );
    }

    /**
     * Creating a new highlight on url with or without initial comment
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
            res.status(400).json({ error: "Invalid query arguments." });
            return;
        }
        if (["?", "&"].some((sub) => req.body.url.includes(sub))) {
            res.status(400).json({ error: "URL argument contains get parameters." });
            return;
        }

        let newHighlight = new Highlight();
        newHighlight.text = req.body.text;
        if (req.body.beforeText) { newHighlight.beforeText = req.body.beforeText; }
        if (req.body.afterText) { newHighlight.afterText = req.body.afterText; }
        newHighlight.index = req.body.index;
        newHighlight.author = req.user;
        // Set to specific viewing group
        let group: Group | undefined;
        if (req.body.groupName) {
            if (!(await user.groupNames()).includes(req.body.groupName)) {
                res.status(400).json({ error: `User does not belong to group ${req.body.groupName}.` });
                return;
            }

            try {
                group = await Group.findOne(req.body.groupName);
                newHighlight.viewingGroup = group;
            } catch {
                res.status(400).json({ error: `Group ${req.body.groupName} does not exist.` });
                return;
            }
        }

        let newComment: TopLevelComment | undefined = undefined;
        if (req.body.comment) {
            newComment = new TopLevelComment();
            newComment.text = req.body.comment;
            newComment.author = req.user;
            newHighlight.topLevelComments = [newComment];
        }

        // Get site by unique url or create a new site
        // Push the comment into the comment list of the new
        const site: Site | undefined = await Site.findOne({
            where: { url: req.body.url },
            relations: ["highlights"],
        });
        if (!site) {
            const newSite = new Site();
            newSite.url = req.body.url;

            newHighlight.site = newSite;
            newHighlight.topLevelComments = [newComment];
            newHighlight = await newHighlight.save();

            res.status(201).json({ newHighlight });
        } else {
            let existingHighlight: Highlight | undefined;
            try {
                existingHighlight = await findExisting(req, user, group);
            } catch {
                existingHighlight = undefined;
            }

            if (!existingHighlight) {
                newHighlight.site = site;
                newHighlight.topLevelComments = [newComment];
                newHighlight = await newHighlight.save();

                res.status(201).json({ newHighlight });
            } else {
                existingHighlight.topLevelComments.push(newComment);
                try {
                    newHighlight = await existingHighlight.save();
                    res.status(201).json({ newHighlight });
                } catch (e) {
                    res.status(400)
                        .json({ error: `Could not create new highlight: ${e}.` });
                }
            }
        }
    }

    async function findExisting(req: Request, user: User, group: Group | undefined): Promise<Highlight> {
        let existingHighlight: Highlight | undefined;
        // TODO: existing highlight needs to pull author, topLevelComments.author, responseComments.author
        if (group) {
            existingHighlight = await Highlight.findOne({
                relations: [
                    "topLevelComments",
                    "topLevelComments.author",
                    "topLevelComments.responseComments",
                    "topLevelComments.responseComments.author",
                ],
                where: {
                    text: req.body.text,
                    index: req.body.index,
                    site: { url: req.body.url },
                    viewingGroup: { name: group.groupName },
                },
            });

            if (!existingHighlight && (req.body.beforeText && req.body.afterText)) {
                const likeHighlight: Highlight | undefined = await Highlight.findOne({
                    where: {
                        text: Like(`%${req.body.text}%`),
                        beforeText: Like(`%${req.body.beforeText}%`),
                        afterText: Like(`%${req.body.afterText}%`),
                        site: { url: req.body.url },
                        viewingGroup: { name: group.groupName },
                    },
                });
                existingHighlight = likeHighlight; // For undefined type
            }
        } else {
            existingHighlight = await Highlight.findOne({
                relations: [
                    "topLevelComments",
                    "topLevelComments.author",
                    "topLevelComments.responseComments",
                    "topLevelComments.responseComments.author",
                ],
                where: {
                    text: req.body.text,
                    index: req.body.index,
                    site: { url: req.body.url },
                },
            });

            if (!existingHighlight && (req.body.beforeText && req.body.afterText)) {
                const likeHighlight: Highlight | undefined = await Highlight.findOne({
                    where: {
                        text: Like(`%${req.body.text}%`),
                        beforeText: Like(`%${req.body.beforeText}%`),
                        afterText: Like(`%${req.body.afterText}%`),
                        site: { url: req.body.url },
                    },
                });
                existingHighlight = likeHighlight; // For undefined type
            }
        }

        return existingHighlight ? Promise.resolve(existingHighlight) : Promise.reject();
    }

    /**
     * Show highlights on a given url
     * Does not load comments
     * @param req
     * @param res
     */
    export async function index(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.user;
        if (req.query.url && !["?", "&"].some((sub) => req.query.url.includes(sub))) {
            try {
                const site: Site = await Site.findOneOrFail({
                    where: { url: req.query.url },
                    relations: [
                        "highlights",
                        "highlights.author",
                        "highlights.topLevelComments",
                        "highlights.topLevelComments.author",
                        "highlights.topLevelComments.responseComments",
                        "highlights.topLevelComments.responseComments.author",
                    ],
                });
                const highlights = await site.highlights;

                // If given groupName, show only from that
                if (req.query.groupName) {
                    if (!user) {
                        res.sendStatus(401);
                        return;
                    }
                    if (req.query.groupName === "mine") {
                        highlights.filter(async (highlight) => highlight.author.username === user.username);
                    } else if (!(await user.groupNames()).includes(req.query.groupName)) {
                        res.status(400).json({ error: `User does not belong to group ${req.query.groupName}.` });
                        return;
                    } else {
                        highlights.filter(async (highlight) => await highlight.hasViewingGroup(req.query.groupName));
                    }

                } else {    // If not, show only those publically available to all (i.e., no group)
                    highlights.filter(async (highlight) => await !highlight.hasViewingGroup());
                }

                res.status(200).json({ highlights });
            } catch {
                res.status(400).json({ error: `${req.query.url} not found.` });
            }
        } else {
            res.status(400).json({ error: "Failure in format of ?url=." });
        }
    }

    /**
     * @param req expects: highlightID in params
     * @param res gives: comment trees for highlight
     */
    export async function show(req: Request, res: Response): Promise<void> {
        if (!req.params.highlightID) {
            res.status(400).json({ error: "No information given." });
            return;
        }
        // Get highlight from unique url, or fail
        const highlight: Highlight | undefined = await Highlight.findOne({
            where: { id: req.params.highlightID },
            relations: [
                "author",
                "topLevelComments",
                "topLevelComments.author",
                "topLevelComments.responseComments",
                "topLevelComments.responseComments.author",
                "viewingGroup",
            ],
        });
        if (!highlight) {
            res.status(400).json({ error: `Highlight ${req.params.highlightID} does not exist` });
            return;
        }

        // Can only be viewed by a user that belongs to the viewing group
        if (highlight.viewingGroup) {
            const user: User | undefined = req.user;
            if (!user) {
                res.sendStatus(401);
                return;
            }
            if (!(await user.groupNames()).includes(req.body.groupName)) {
                res.status(400).json({ error: `User does not belong to group ${req.body.groupName}.` });
                return;
            }
        }

        // FIXME: No longer tree repo
        // Get all comment trees that exist under a highlight

        res.status(200).json({ topLevelComments: highlight.topLevelComments });
    }
}
