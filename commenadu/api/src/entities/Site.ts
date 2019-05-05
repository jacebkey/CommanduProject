import { IsFQDN } from "class-validator";
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Highlight } from ".";

@Entity()
export class Site extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ unique: true })
    @IsFQDN()
    public url: string;

    @OneToMany(type => Highlight, highlight => highlight.site)
    public highlights: Promise<Highlight[]>;
}
