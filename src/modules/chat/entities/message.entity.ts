import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Conversation } from "./conversation.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: true })
  text!: string;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column({ default: false })
  isRead!: boolean;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversation_id" })
  conversation!: Conversation;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
