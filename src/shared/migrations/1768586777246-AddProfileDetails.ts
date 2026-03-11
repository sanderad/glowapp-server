import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileDetails1768586777246 implements MigrationInterface {
    name = 'AddProfileDetails1768586777246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ADD "yearsOfExperience" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`CREATE TYPE "public"."stylist_profiles_colortheme_enum" AS ENUM('purple', 'blue', 'orange', 'pink', 'teal')`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ADD "colorTheme" "public"."stylist_profiles_colortheme_enum" NOT NULL DEFAULT 'purple'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stylist_profiles" DROP COLUMN "colorTheme"`);
        await queryRunner.query(`DROP TYPE "public"."stylist_profiles_colortheme_enum"`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" DROP COLUMN "yearsOfExperience"`);
    }

}
