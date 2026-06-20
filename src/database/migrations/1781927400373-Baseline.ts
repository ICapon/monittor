import { MigrationInterface, QueryRunner } from "typeorm";

export class Baseline1781927400373 implements MigrationInterface {
    name = 'Baseline1781927400373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "commands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(64) NOT NULL, "description" character varying(255) NOT NULL, "response" text NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7ac292c3aa19300482b2b190d1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_87632c6d4596995f1346b23c0c" ON "commands"  ("name") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(64) NOT NULL, "passwordHash" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users"  ("username") `);
        await queryRunner.query(`CREATE TABLE "user_commands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "commandId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_145dfaddc251c80b1ba26cd5e50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aa99e28705b15e8776544cb78b" ON "user_commands"  ("userId", "commandId") `);
        await queryRunner.query(`ALTER TABLE "user_commands" ADD CONSTRAINT "FK_a6cdbf9116fbc02a60a5f53a7c9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_commands" ADD CONSTRAINT "FK_f1885b612523cb75aad644df8ef" FOREIGN KEY ("commandId") REFERENCES "commands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_commands" DROP CONSTRAINT "FK_f1885b612523cb75aad644df8ef"`);
        await queryRunner.query(`ALTER TABLE "user_commands" DROP CONSTRAINT "FK_a6cdbf9116fbc02a60a5f53a7c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa99e28705b15e8776544cb78b"`);
        await queryRunner.query(`DROP TABLE "user_commands"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87632c6d4596995f1346b23c0c"`);
        await queryRunner.query(`DROP TABLE "commands"`);
    }

}
