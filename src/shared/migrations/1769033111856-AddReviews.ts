import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviews1769033111856 implements MigrationInterface {
    name = 'AddReviews1769033111856'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "date" TIMESTAMP NOT NULL, "rating" numeric(10,2) NOT NULL, "comment" character varying NOT NULL, "user_id" integer, "stylist_id" integer, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_24d02fcdb27daade8b49147ba5b" FOREIGN KEY ("stylist_id") REFERENCES "stylist_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_24d02fcdb27daade8b49147ba5b"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
    }

}
