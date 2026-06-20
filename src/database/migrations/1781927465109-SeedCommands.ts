import { MigrationInterface, QueryRunner } from 'typeorm';

// Seeds the command *catalog* only — no grants. Granting commands to a
// specific user (e.g. the seeded admin) needs that user's id, which only
// exists after UsersService.onApplicationBootstrap() runs, well after
// migrations have already completed — see commands.service.ts /
// users.service.ts for where grants actually happen.
export class SeedCommands1781927465109 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "commands" (id, name, description, response, enabled, "createdAt", "updatedAt")
       VALUES (uuid_generate_v4(), $1, $2, $3, true, now(), now())
       ON CONFLICT (name) DO NOTHING`,
      ['whoami', 'show identity', 'you are root.'],
    );
    await queryRunner.query(
      `INSERT INTO "commands" (id, name, description, response, enabled, "createdAt", "updatedAt")
       VALUES (uuid_generate_v4(), $1, $2, $3, true, now(), now())
       ON CONFLICT (name) DO NOTHING`,
      [
        'adduser',
        'create a new user (admin only)',
        'usage: adduser (interactive — prompts for username and password)',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "commands" WHERE name IN ('whoami', 'adduser')`);
  }
}
