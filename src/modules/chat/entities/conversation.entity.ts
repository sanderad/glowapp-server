import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Message } from "./message.entity";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "participant1_id" })
  participant1!: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "participant2_id" })
  participant2!: User;

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages!: Message[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
