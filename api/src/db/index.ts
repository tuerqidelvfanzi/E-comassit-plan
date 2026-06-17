import Database from 'better-sqlite3';
import { getDbPath } from '../config.js';
import { migrate } from './migrate.js';

type SqliteDb = Database.Database;

let db: SqliteDb | null = null;

export function getDb(): SqliteDb {
  if (!db) {
    migrate();
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDb() {
  db?.close();
  db = null;
}
