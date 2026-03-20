'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_requests_user_created_at"
      ON "requests" ("user_id", "created_at" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_requests_equipment_created_at"
      ON "requests" ("equipment_id", "created_at" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_requests_status_created_at"
      ON "requests" ("status", "created_at" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_requests_status_request_date"
      ON "requests" ("status", "request_date" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_requests_equipment_request_date"
      ON "requests" ("equipment_id", "request_date" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_requests_approved_by"
      ON "requests" ("approved_by")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_equipment_room_id"
      ON "equipment" ("room_id")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_equipment_status_updated_at"
      ON "equipment" ("status", "updated_at" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_equipment_type"
      ON "equipment" ("type")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_equipment_name_trgm"
      ON "equipment" USING GIN ("name" gin_trgm_ops)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_equipment_type_trgm"
      ON "equipment" USING GIN ("type" gin_trgm_ops)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_equipment_serial_number_trgm"
      ON "equipment" USING GIN ("serial_number" gin_trgm_ops)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_return_condition_logs_equipment_recorded_at"
      ON "return_condition_logs" ("equipment_id", "recorded_at" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_return_condition_logs_request_recorded_at"
      ON "return_condition_logs" ("request_id", "recorded_at" DESC)
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_rooms_floor_id"
      ON "rooms" ("floor_id")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_expires_at"
      ON "refresh_tokens" ("expires_at")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_lower_email"
      ON "users" (LOWER("email"))
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_lower_username"
      ON "users" (LOWER("username"))
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_users_lower_username"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_users_lower_email"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_refresh_tokens_expires_at"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_rooms_floor_id"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_return_condition_logs_request_recorded_at"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_return_condition_logs_equipment_recorded_at"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_equipment_serial_number_trgm"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_equipment_type_trgm"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_equipment_name_trgm"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_equipment_type"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_equipment_status_updated_at"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_equipment_room_id"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_requests_approved_by"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_requests_equipment_request_date"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_requests_status_request_date"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_requests_status_created_at"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_requests_equipment_created_at"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_requests_user_created_at"');
  }
};
