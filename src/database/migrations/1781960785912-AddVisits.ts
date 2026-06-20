import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisits1781960785912 implements MigrationInterface {
    name = 'AddVisits1781960785912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "visitorId" uuid NOT NULL, "userId" uuid, "ip" character varying(45) NOT NULL, "location" character varying(255) NOT NULL, "browser" character varying(100) NOT NULL, "engine" character varying(100) NOT NULL, "os" character varying(100) NOT NULL, "device" character varying(100) NOT NULL, "language" character varying(100) NOT NULL, "referer" character varying(500) NOT NULL, "userAgent" text NOT NULL, "lastPath" character varying(255) NOT NULL, "visitCount" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_52f6829d1c4bad3f2503d4f3f6" ON "visits"  ("visitorId") `);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "FK_28f19616757b505532162fd6e75" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "FK_28f19616757b505532162fd6e75"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52f6829d1c4bad3f2503d4f3f6"`);
        await queryRunner.query(`DROP TABLE "visits"`);
    }

}
