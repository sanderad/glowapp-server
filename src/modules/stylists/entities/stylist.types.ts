import { User } from "../../users/entities/user.entity";
import { Service } from "./service.entity";

export interface StylistDetailed {
  id: number;
  businessName: string;
  category: string;
  rating: number;
  reviewsCount: string;
  yearsOfExperience: string;
  colorTheme: "purple" | "blue" | "orange" | "pink";
  speciality: string;
  bio: string;
  user: User;
  services: Service[];
}
