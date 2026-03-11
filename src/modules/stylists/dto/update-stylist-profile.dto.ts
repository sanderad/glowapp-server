import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateServiceDto {
  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsString()
  duration!: string;
}

export class UpdateStylistProfileDto {
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  yearsOfExperience?: string;

  @IsString()
  @IsOptional()
  colorTheme?: string;

  @IsString()
  @IsOptional()
  speciality?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateServiceDto)
  @IsOptional()
  services?: UpdateServiceDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  portfolio?: string[];
}
