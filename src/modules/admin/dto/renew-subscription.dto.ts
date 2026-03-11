import { IsNumber, IsIn, IsString } from "class-validator";

export class RenewSubscriptionDto {
  @IsNumber()
  @IsIn([1, 3], { message: "monthsToAdd debe ser 1 o 3" })
  monthsToAdd!: number;

  @IsString()
  @IsIn(["nequi", "efectivo"], {
    message: "paymentMethod debe ser nequi o efectivo",
  })
  paymentMethod!: string;
}
