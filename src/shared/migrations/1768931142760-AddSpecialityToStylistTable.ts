import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpecialityToStylistTable1768931142760 implements MigrationInterface {
    name = 'AddSpecialityToStylistTable1768931142760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ADD "speciality" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stylist_profiles" DROP COLUMN "speciality"`);
    }

}
