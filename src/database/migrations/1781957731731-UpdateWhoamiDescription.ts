import { MigrationInterface, QueryRunner } from 'typeorm';

// "whoami" became a dynamic command (GET /whoami, see home.controller.ts) —
// the client now special-cases it and never reads the static `response`
// column, but keep it descriptive for anyone browsing the table directly.
export class UpdateWhoamiDescription1781957731731 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "commands" SET description = $1, response = $2 WHERE name = $3`,
      [
        'show live request info (ip, geo, browser, etc.)',
        '(dynamic — served live by GET /whoami, this column is unused)',
        'whoami',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "commands" SET description = $1, response = $2 WHERE name = $3`,
      ['show identity', 'you are root.', 'whoami'],
    );
  }
}
