import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

export enum UserRole {
  CLIENT = "CLIENT",
  STYLIST = "STYLIST",
  ADMIN = "ADMIN",
}

import { Favorite } from "./favorite.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  fullName!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ select: false, nullable: false })
  password!: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.CLIENT,
    nullable: false,
  })
  role!: UserRole;

  @OneToMany(() => Favorite, (favorite) => favorite.user, { cascade: true })
  favorites!: Favorite[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
