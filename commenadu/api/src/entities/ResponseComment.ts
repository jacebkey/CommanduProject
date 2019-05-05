import { Entity, ManyToMany, ManyToOne } from "typeorm";
import { TopLevelComment, User } from ".";
import { Comment } from "./Comment";

@Entity()
export class ResponseComment extends Comment {
    @ManyToOne(type => User, user => user.responseComments, {
        cascade: true,
    })
    public author: User;

    @ManyToMany(type => User, user => user.shoutOuts)
    public shoutOuts: User[];

    @ManyToOne(type => TopLevelComment, topLevelComment => topLevelComment.responseComments)
    public topLevelComment: TopLevelComment;
}
