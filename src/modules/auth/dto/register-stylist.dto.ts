import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ProfileTheme,
  StylistCategory,
} from "../../stylists/entities/stylist-profile.entity";

// DTO Auxiliar para los servicios
class ServiceDto {
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  price!: number;

  @IsNotEmpty()
  duration!: string;
}

export class RegisterStylistDto {
  // --- PASO 1: CUENTA ---
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  // --- PASO 2: NEGOCIO ---
  @IsNotEmpty()
  businessName!: string;

  @IsEnum(StylistCategory)
  category!: StylistCategory;

  @IsString()
  bio!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Agregar campo para Logo/Foto de perfil del negocio
  @IsOptional()
  @IsString()
  photoUrl?: string;

  // Agregar campo para Portafolio (Array de strings)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  portfolio?: string[];

  // --- PASO 3: SERVICIOS ---
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto) // Necesario para validar objetos dentro de arrays
  services!: ServiceDto[];

  @IsInt({ message: "Los años de experiencia deben ser un número entero" })
  @Min(0)
  yearsOfExperience!: number;

  @IsString()
  @MinLength(3)
  speciality!: string;

  @IsEnum(ProfileTheme, { message: "El color no es válido" })
  colorTheme!: ProfileTheme;
}
