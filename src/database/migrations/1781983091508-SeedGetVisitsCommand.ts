import { MigrationInterface, QueryRunner } from 'typeorm';

// Catalog row only — no grants here (same reasoning as SeedCommands: the
// admin user doesn't exist yet when migrations run; UsersService grants
// this to it on bootstrap instead). Like "whoami"/"adduser", this command
// is special-cased client-side (GET /visits, paginated), so `response` is
// never actually shown.
export class SeedGetVisitsCommand1781983091508 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "commands" (id, name, description, response, enabled, "createdAt", "updatedAt")
       VALUES (uuid_generate_v4(), $1, $2, $3, true, now(), now())
       ON CONFLICT (name) DO NOTHING`,
      [
        'get-visits',
        'list recorded visits (admin only)',
        '(dynamic — served live by GET /visits, this column is unused)',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "commands" WHERE name = $1`, ['get-visits']);
  }
}
