import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisitMetadata1781977900790 implements MigrationInterface {
    name = 'AddVisitMetadata1781977900790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visits" ADD "metadata" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "metadata"`);
    }

}
