import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  IsOptional,
} from "class-validator";

export class RegisterClientDto {
  @IsNotEmpty({ message: "El nombre completo es obligatorio" })
  @IsString()
  fullName!: string;

  @IsEmail({}, { message: "El correo electrónico no es válido" })
  email!: string;

  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
