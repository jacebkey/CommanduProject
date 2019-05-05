import { compareSync, hashSync } from "bcrypt-nodejs";
import { IsEmail, Length } from "class-validator";
import jwt from "jsonwebtoken";
import { AfterLoad, BaseEntity, BeforeInsert, BeforeRemove, BeforeUpdate, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Group, Highlight, ResponseComment, TopLevelComment } from ".";
import { constants } from "../constants";

export interface PrivateUserInfo {
    id: number;
    username: string;
    email: string;
    token: string;
    topLevelComments: TopLevelComment[];
    responseComments: ResponseComment[];
    shoutOuts: ResponseComment[];
    highlights: Highlight[];
    groups: Group[];
}

export interface PublicUserInfo {
    id: number;
    username: string;
    topLevelComments: TopLevelComment[];
    responseComments: ResponseComment[];
    highlights: Highlight[];
}

@Entity()
export class User extends BaseEntity {
    private tempPassword: string;

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ unique: true })
    @Length(1, 30)
    public username: string;

    @Column({ unique: true })
    @IsEmail()
    public email: string;

    @Column()
    public password: string;

    // Storing list of liked comment ids cause I'm lazy and don't want to build a relation
    @Column({ type: "text", default: "[]" })
    public likedCommentIDs: string;

    @OneToMany(type => Highlight, highlight => highlight.author)
    public highlights: Promise<Highlight[]>;

    @OneToMany(type => TopLevelComment, topLevelComment => topLevelComment.author)
    public topLevelComments: Promise<TopLevelComment[]>;

    @OneToMany(type => ResponseComment, responseComment => responseComment.author)
    public responseComments: Promise<ResponseComment[]>;

    @ManyToMany(type => ResponseComment, responseComment => responseComment.shoutOuts)
    @JoinTable()
    public shoutOuts: Promise<ResponseComment[]>;

    @ManyToMany(type => Group, group => group.members)
    @JoinTable()
    public groups: Promise<Group[]>;

    @BeforeInsert()
    @BeforeUpdate()
    private hashPassword(): void {
        if (this.tempPassword !== this.password) {
            // Replace plain string pass with hash pass
            this.password = hashSync(this.password);
        }
    }

    @AfterLoad()
    private loadTempPassword(): void {
        this.tempPassword = this.password;
    }

    @BeforeRemove()
    private async transferToDeletedUser(): Promise<void> {
        let deletedUser: User | undefined = await User.findOne({ where: { username: constants.DELETED_USER_USERNAME } });

        // Should have been created to begin with but isn't a sure thing apparently
        if (!deletedUser) {
            const deletedOwner = new User();
            deletedOwner.username = constants.DELETED_USER_USERNAME;
            deletedOwner.password = constants.DELETED_USER_PASSWORD;
            deletedOwner.email = constants.DELETED_USER_EMAIL;
            try {
                deletedUser = await deletedOwner.save();
            } catch {
                return Promise.reject("Could not find deletedUser.");
            }
        }

        const highlights = await this.highlights;
        for (const highlight of highlights) {
            highlight.author = deletedUser;
            await highlight.save();
        }

        const topLevelComments = await this.topLevelComments;
        for (const comment of topLevelComments) {
            comment.author = deletedUser;
            await comment.save();
        }

        const responseComments = await this.responseComments;
        for (const comment of responseComments) {
            comment.author = deletedUser;
            await comment.save();
        }

        deletedUser.shoutOuts = Promise.resolve(await this.shoutOuts);
        await deletedUser.save();
    }

    private getJWT(): string {
        return jwt.sign({ id: this.id }, constants.JWT_SECRET);
    }

    public authenticate(password: string): boolean {
        return compareSync(password, this.password);
    }

    public async groupNames(): Promise<string[]> {
        return (await this.groups).map((group) => group.groupName);
    }

    public async joinGroup(groupName: string): Promise<PrivateUserInfo> {
        const group: Group | undefined = await Group.findOne(groupName, { relations: ["members"] });
        if (group && !(await this.groupNames()).includes(groupName)) {
            group.members.push(this);
            await group.save();
        } else {
            return Promise.reject(`Group with name "${groupName}" does not exist.`);
        }

        return this.privateVersion();
    }

    public async leaveGroup(groupName: string): Promise<PrivateUserInfo> {
        const group: Group | undefined = await Group.findOne(groupName, { relations: ["members"] });
        if (group) {
            const memberIndex = group.members.findIndex((member) => member.id === this.id);
            if (memberIndex !== -1) {
                group.members.splice(memberIndex, 1);
                await group.save();
            } else {
                return Promise.reject(`User does not belong to a group named "${groupName}."`);
            }
        } else {
            return Promise.reject(`User does not belong to a group named "${groupName}."`);
        }

        return this.privateVersion();
    }

    public async toggleLikeComment(id: number): Promise<number> {
        const likedCommentIDs: number[] = JSON.parse(this.likedCommentIDs);

        let retVal = 0;
        if (likedCommentIDs.includes(id)) {
            likedCommentIDs.splice(likedCommentIDs.indexOf(id), 1);
            retVal = -1;
        } else {
            likedCommentIDs.push(id);
            retVal = 1;
        }

        this.likedCommentIDs = JSON.stringify(likedCommentIDs);
        try {
            await this.save();
            return retVal;
        } catch {
            Promise.reject("Could not save after toggling comment like on ID.");
        }
    }

    public async privateVersion(): Promise<PrivateUserInfo> {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            token: this.getJWT(),
            topLevelComments: await this.topLevelComments,
            responseComments: await this.responseComments,
            shoutOuts: await this.shoutOuts,
            highlights: await this.highlights,
            groups: await this.groups,
        };
    }

    public async publicVersion(): Promise<PublicUserInfo> {
        return {
            id: this.id,
            username: this.username,
            topLevelComments: await this.topLevelComments,
            responseComments: await this.responseComments,
            highlights: await this.highlights,
        };
    }

    // toJson cannot have async attribute. Limitation of node
    public toJSON(): { id: number; username: string } {
        return {
            id: this.id,
            username: this.username,
        };
    }
}
