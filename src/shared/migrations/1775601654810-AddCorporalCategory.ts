import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCorporalCategory1775601654810 implements MigrationInterface {
    name = 'AddCorporalCategory1775601654810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."stylist_profiles_category_enum" RENAME TO "stylist_profiles_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."stylist_profiles_category_enum" AS ENUM('Uñas', 'Cabello', 'Barbería', 'Facial', 'Maquillaje', 'Corporal', 'Otro')`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ALTER COLUMN "category" TYPE "public"."stylist_profiles_category_enum" USING "category"::"text"::"public"."stylist_profiles_category_enum"`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ALTER COLUMN "category" SET DEFAULT 'Uñas'`);
        await queryRunner.query(`DROP TYPE "public"."stylist_profiles_category_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."stylist_profiles_category_enum_old" AS ENUM('Uñas', 'Cabello', 'Barbería', 'Facial', 'Maquillaje', 'Otro')`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ALTER COLUMN "category" TYPE "public"."stylist_profiles_category_enum_old" USING "category"::"text"::"public"."stylist_profiles_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ALTER COLUMN "category" SET DEFAULT 'Uñas'`);
        await queryRunner.query(`DROP TYPE "public"."stylist_profiles_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."stylist_profiles_category_enum_old" RENAME TO "stylist_profiles_category_enum"`);
    }

}
