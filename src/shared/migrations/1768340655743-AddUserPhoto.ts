import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPhoto1768340655743 implements MigrationInterface {
    name = 'AddUserPhoto1768340655743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "photoUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "photoUrl"`);
    }

}
