const fs = require('fs');
const path = require('path');

// Read as text only: the migration connects to the database when required.
const source = fs.readFileSync(path.join(__dirname, '../../migrations/migrateFeatureUpdates.js'), 'utf8');

describe('livestream migration SQL', () => {
  test('creates the single-row live_stream table and seeds it idempotently, before COMMIT', () => {
    const table = source.indexOf('CREATE TABLE IF NOT EXISTS live_stream (');
    const seed = source.indexOf('INSERT INTO live_stream (id, is_live) VALUES (1, FALSE)');
    const commit = source.indexOf("await client.query('COMMIT');");

    expect(table).toBeGreaterThan(-1);
    expect(source).toContain('id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1)');
    expect(source).toContain('updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL');
    expect(seed).toBeGreaterThan(table);
    expect(source.slice(seed, seed + 120)).toContain('ON CONFLICT (id) DO NOTHING');
    expect(commit).toBeGreaterThan(seed);
  });
});
