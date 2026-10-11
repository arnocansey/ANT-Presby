const fs = require('fs');
const path = require('path');

// Read as text only: the migration connects to the database when required.
const source = fs.readFileSync(path.join(__dirname, '../../migrations/migrateFeatureUpdates.js'), 'utf8');

describe('attendance operations migration SQL', () => {
  const commit = source.indexOf("await client.query('COMMIT');");

  test('adds the usher switch and card code to users, before COMMIT', () => {
    const alter = source.indexOf('ADD COLUMN IF NOT EXISTS can_take_attendance BOOLEAN NOT NULL DEFAULT FALSE');
    expect(alter).toBeGreaterThan(-1);
    expect(source).toContain('ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(16)');
    expect(source).toContain('CREATE UNIQUE INDEX IF NOT EXISTS users_check_in_code_key ON users(check_in_code)');
    expect(commit).toBeGreaterThan(alter);
  });

  test('creates event_headcounts with non-negative counts, before COMMIT', () => {
    const table = source.indexOf('CREATE TABLE IF NOT EXISTS event_headcounts (');
    expect(table).toBeGreaterThan(-1);
    expect(source).toContain('event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE');
    expect(source).toContain('adults INTEGER NOT NULL DEFAULT 0 CHECK (adults >= 0)');
    expect(source).toContain('children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0)');
    expect(commit).toBeGreaterThan(table);
  });
});
