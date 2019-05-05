import { Length } from "class-validator";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from "typeorm";

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ type: "text" })
    @Length(1, 255)
    public text: string;

    @Column({ type: "int", default: 0 })
    public likes: number;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;
}
