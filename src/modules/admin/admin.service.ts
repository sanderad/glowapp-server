import { injectable } from "inversify";
import { AppDataSource } from "../../config/data-source";
import { StylistProfile } from "../stylists/entities/stylist-profile.entity";
import { RenewSubscriptionDto } from "./dto/renew-subscription.dto";

@injectable()
export class AdminService {
  private stylistRepo = AppDataSource.getRepository(StylistProfile);

  public async getAllStylists() {
    const stylists = await this.stylistRepo.find({
      relations: ["user"],
      select: {
        id: true,
        businessName: true,
        phone: true,
        subscriptionEndsAt: true,
        isVisible: true,
        user: {
          id: true,
          fullName: true,
          photoUrl: true,
          email: true,
        },
      },
      order: {
        id: "DESC",
      },
    });

    return stylists;
  }

  public async renewSubscription(stylistId: number, dto: RenewSubscriptionDto) {
    const stylist = await this.stylistRepo.findOne({
      where: { id: stylistId },
      relations: ["user"],
    });

    if (!stylist) {
      throw new Error("Estilista no encontrado");
    }

    const now = new Date();
    // Start from today if expired, else add to existing future date
    const baseDate =
      stylist.subscriptionEndsAt < now ? now : stylist.subscriptionEndsAt;

    // Add months (approximated conceptually to 30 days or accurate UTC months)
    const newEndDate = new Date(baseDate);
    newEndDate.setMonth(newEndDate.getMonth() + dto.monthsToAdd);

    stylist.subscriptionEndsAt = newEndDate;
    stylist.isVisible = true;

    await this.stylistRepo.save(stylist);

    return {
      id: stylist.id,
      businessName: stylist.businessName,
      subscriptionEndsAt: stylist.subscriptionEndsAt,
      isVisible: stylist.isVisible,
    };
  }
}
