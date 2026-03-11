import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class CreateReviewDto {
  @IsNumber({}, { message: "La calificación debe ser un número" })
  @Min(1, { message: "La calificación mínima es 1" })
  @Max(5, { message: "La calificación máxima es 5" })
  rating!: number;

  @IsString({ message: "El comentario debe ser texto" })
  @IsNotEmpty({ message: "El comentario no puede estar vacío" })
  comment!: string;
}
