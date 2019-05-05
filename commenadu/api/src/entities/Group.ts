import randomWords from "random-words";
import { BaseEntity, BeforeInsert, Entity, ManyToMany, OneToMany, PrimaryColumn } from "typeorm";
import { Highlight, User } from ".";

@Entity()
export class Group extends BaseEntity {
    get groupName(): string {
        return this.name;
    }
    @PrimaryColumn()
    // tslint:disable-next-line: variable-name
    private name: string;

    @ManyToMany(type => User, user => user.groups)
    public members: User[];

    @OneToMany(type => Highlight, highlight => highlight.viewingGroup)
    public highlights: Highlight[];

    @BeforeInsert()
    private async setName(): Promise<void> {
        this.name = await Group.getUniqueName();
    }

    private static async getAllGroupNames(): Promise<string[]> {
        const values = await this.createQueryBuilder("Group")
            .select("Group.name")
            .getMany();
        return values.map((group) => group.name);
    }

    private static async getUniqueName(): Promise<string> {
        let name: string = Group.nameGenerator();
        const groupNames = await this.getAllGroupNames();

        while (groupNames.includes(name)) {
            name = Group.nameGenerator();
        }

        return name;
    }

    private static nameGenerator(): string {
        return randomWords({ exactly: 4, join: "-" });
    }
}
