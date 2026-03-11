import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { StylistProfile } from "../../stylists/entities/stylist-profile.entity";

@Entity("favorites")
export class Favorite {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => StylistProfile, (stylist) => stylist.favoritedBy, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "stylist_id" })
  stylist!: StylistProfile;

  @CreateDateColumn()
  createdAt!: Date;
}
