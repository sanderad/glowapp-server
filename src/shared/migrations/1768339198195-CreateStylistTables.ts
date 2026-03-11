import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStylistTables1768339198195 implements MigrationInterface {
    name = 'CreateStylistTables1768339198195'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "services" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "duration" character varying NOT NULL, "stylistId" integer, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."stylist_profiles_category_enum" AS ENUM('Uñas', 'Cabello', 'Barbería', 'Facial', 'Maquillaje', 'Otro')`);
        await queryRunner.query(`CREATE TABLE "stylist_profiles" ("id" SERIAL NOT NULL, "businessName" character varying NOT NULL, "category" "public"."stylist_profiles_category_enum" NOT NULL DEFAULT 'Uñas', "bio" text, "city" character varying NOT NULL DEFAULT 'Cali', "isVisible" boolean NOT NULL DEFAULT true, "subscriptionEndsAt" TIMESTAMP NOT NULL, "rating" double precision NOT NULL DEFAULT '0', "reviewsCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "REL_5be7993947c0977503c5210eae" UNIQUE ("userId"), CONSTRAINT "PK_0291f9fa98d6e70c98a0d527ac6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_4ebfeda8dfc740b6a98fb4e6abb" FOREIGN KEY ("stylistId") REFERENCES "stylist_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ADD CONSTRAINT "FK_5be7993947c0977503c5210eae1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stylist_profiles" DROP CONSTRAINT "FK_5be7993947c0977503c5210eae1"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_4ebfeda8dfc740b6a98fb4e6abb"`);
        await queryRunner.query(`DROP TABLE "stylist_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."stylist_profiles_category_enum"`);
        await queryRunner.query(`DROP TABLE "services"`);
    }

}
