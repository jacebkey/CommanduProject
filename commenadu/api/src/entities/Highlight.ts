import { IsInt, Length } from "class-validator";
import { AfterLoad, BaseEntity, BeforeUpdate, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Group, Site, TopLevelComment, User } from ".";

@Entity()
@Unique(["text", "beforeText", "afterText", "index", "site"])
export class Highlight extends BaseEntity {
    private tempGroup: Group;

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: "text" })
    @Length(1, 255)
    public text: string;

    // To be used as a locator if text has been changed slightly
    @Column({ type: "text", nullable: true })
    @Length(1, 30)
    public beforeText: string;

    @Column({ type: "text", nullable: true })
    @Length(1, 30)
    public afterText: string;

    @Column({ default: 0 })
    @IsInt()
    public index: number;

    @ManyToOne(type => Site, site => site.highlights, {
        cascade: true,
    })
    public site: Site;

    @ManyToOne(type => User, user => user.highlights, {
        cascade: true,
    })
    public author: User;

    @OneToMany(type => TopLevelComment, topLevelComment => topLevelComment.highlight, {
        cascade: true,
    })
    public topLevelComments: TopLevelComment[];

    // Can only be accessible to one group
    // Cannot be switch to a different group at a later time
    // If null, this is accessible to all groups
    @ManyToOne(type => Group, group => group.highlights, {
        nullable: true,
    })
    public viewingGroup: Group;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    @BeforeUpdate()
    private enforceStaticViewingGroup(): void {
        if (this.tempGroup.groupName !== this.viewingGroup.groupName) {
            this.viewingGroup = this.tempGroup;
        }
    }

    @AfterLoad()
    private loadTempGroup(): void {
        this.tempGroup = this.viewingGroup;
    }

    public async hasViewingGroup(groupName?: string | undefined): Promise<boolean> {
        const highlight = await Highlight.findOne(this.id, { relations: ["viewingGroup"] });
        if (groupName) {
            return highlight.viewingGroup.groupName === groupName;
        } else if (highlight.viewingGroup !== undefined) {
            return true;
        }
    }
}
