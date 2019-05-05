import { Entity, ManyToOne, OneToMany } from "typeorm";
import { Highlight, ResponseComment, User } from ".";
import { Comment } from "./Comment";

@Entity()
export class TopLevelComment extends Comment {
    @ManyToOne(type => User, user => user.topLevelComments, {
        cascade: true,
    })
    public author: User;

    @ManyToOne(type => Highlight, highlight => highlight.topLevelComments)
    public highlight: Highlight;

    @OneToMany(type => ResponseComment, response => response.topLevelComment, {
        cascade: true,
    })
    public responseComments: ResponseComment[];
}
