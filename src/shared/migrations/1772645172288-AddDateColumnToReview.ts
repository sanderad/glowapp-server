import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateColumnToReview1772645172288 implements MigrationInterface {
    name = 'AddDateColumnToReview1772645172288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "date" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "date" DROP DEFAULT`);
    }

}
