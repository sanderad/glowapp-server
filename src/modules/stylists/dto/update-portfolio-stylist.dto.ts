import { IsArray, IsString } from "class-validator";

export class UpdatePortfolioStylistDto {
  @IsArray()
  @IsString({ each: true })
  imageUrls!: string[];
}
