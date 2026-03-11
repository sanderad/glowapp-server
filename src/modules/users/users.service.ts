import { injectable } from "inversify";
import { AppDataSource } from "../../config/data-source";
import { User } from "./entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import bcrypt from "bcryptjs";

@injectable()
export class UsersService {
  private userRepo = AppDataSource.getRepository(User);

  public async updateMe(userId: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Optional updates
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.email) {
      // Validar si el nuevo email ya está en uso por otro
      const existing = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new Error("Este correo electrónico ya está en uso");
      }
      user.email = dto.email;
    }
    if (dto.photoUrl) user.photoUrl = dto.photoUrl;

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(dto.password, salt);
    }

    await this.userRepo.save(user);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
    };
  }
}
