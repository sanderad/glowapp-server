import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneNumber1772816622740 implements MigrationInterface {
    name = 'AddPhoneNumber1772816622740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stylist_profiles" ADD "phone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stylist_profiles" DROP COLUMN "phone"`);
    }

}
