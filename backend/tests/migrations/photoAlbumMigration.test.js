const fs = require('fs');
const path = require('path');

// Read as text only: the migration connects to the database when required.
const source = fs.readFileSync(path.join(__dirname, '../../migrations/migrateFeatureUpdates.js'), 'utf8');

describe('photo album migration SQL', () => {
  test('creates both album tables before COMMIT, with cascade, unique public ids and indexes', () => {
    const commit = source.indexOf("await client.query('COMMIT');");
    ['photo_albums', 'album_photos'].forEach((table) => {
      const at = source.indexOf(`CREATE TABLE IF NOT EXISTS ${table} (`);
      expect(at).toBeGreaterThan(-1);
      expect(at).toBeLessThan(commit);
    });
    expect(source).toContain('album_id INTEGER NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE');
    expect(source).toContain('CONSTRAINT album_photos_public_id_key UNIQUE (public_id)');
    expect(source).toContain('ON photo_albums(is_published, created_at DESC)');
    expect(source).toContain('ON album_photos(album_id, sort_order)');
  });
});
