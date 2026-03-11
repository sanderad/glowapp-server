import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { StylistProfile } from "./stylist-profile.entity";

@Entity({ name: "reviews" })
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  date!: Date;

  @Column("decimal", { precision: 10, scale: 2 })
  rating!: number;

  @Column()
  comment!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => StylistProfile, (stylist) => stylist.reviews, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "stylist_id" })
  stylist!: StylistProfile;
}
