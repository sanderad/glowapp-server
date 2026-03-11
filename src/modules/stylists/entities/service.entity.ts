import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { StylistProfile } from "./stylist-profile.entity";

@Entity({ name: "services" })
export class Service {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column("decimal", { precision: 10, scale: 2 }) // Para dinero siempre decimal
  price!: number;

  @Column()
  duration!: string; // Ej: "2 horas"

  @ManyToOne(() => StylistProfile, (stylist) => stylist.services)
  stylist!: StylistProfile;
}
