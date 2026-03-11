import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePortfolioTable1768341419099 implements MigrationInterface {
    name = 'CreatePortfolioTable1768341419099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "portfolio_images" ("id" SERIAL NOT NULL, "imageUrl" character varying NOT NULL, "stylistId" integer, CONSTRAINT "PK_4fb584b54f9368be1a6612a4e83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "portfolio_images" ADD CONSTRAINT "FK_e73707f902c77e9718744537009" FOREIGN KEY ("stylistId") REFERENCES "stylist_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_images" DROP CONSTRAINT "FK_e73707f902c77e9718744537009"`);
        await queryRunner.query(`DROP TABLE "portfolio_images"`);
    }

}
