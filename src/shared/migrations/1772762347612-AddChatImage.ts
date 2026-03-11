import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatImage1772762347612 implements MigrationInterface {
    name = 'AddChatImage1772762347612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "imageUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "text" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "text" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "imageUrl"`);
    }

}
