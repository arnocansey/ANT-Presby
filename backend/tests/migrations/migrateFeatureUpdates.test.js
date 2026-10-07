const fs = require('fs');
const path = require('path');

// Read as text only: the migration connects to the database when required.
const source = fs.readFileSync(path.join(__dirname, '../../migrations/migrateFeatureUpdates.js'), 'utf8');

describe('feature migration SQL', () => {
  test('every DO block is dollar-quoted with $$', () => {
    const openers = source.match(/\bDO \$+/g) || [];
    const closers = (source.match(/\bEND\s+\$+;/g) || []).map((token) => token.replace(/\s+/, ' '));

    expect(openers.length).toBeGreaterThan(0);
    expect(openers.every((token) => token === 'DO $$')).toBe(true);
    expect(closers).toHaveLength(openers.length);
    expect(closers.every((token) => token === 'END $$;')).toBe(true);
  });

  test('creates the phase 5 and phase 6 types and tables', () => {
    ['devotional_status', 'announcement_audience'].forEach((type) => expect(source).toContain(`CREATE TYPE ${type}`));
    ['devotionals', 'push_tokens', 'announcements'].forEach((table) =>
      expect(source).toContain(`CREATE TABLE IF NOT EXISTS ${table} (`)
    );
  });

  test('adds the event image column', () => {
    expect(source).toContain('ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)');
  });
});
