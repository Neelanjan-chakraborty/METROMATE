import type { BindValue, Db } from '../types';

// Node's built-in SQLite, used only in tests. `process.getBuiltinModule` is used
// because Jest's resolver does not know the scheme-only `node:sqlite` module.
const { DatabaseSync } = (process as any).getBuiltinModule('node:sqlite');

export class NodeSqliteDb implements Db {
  private d: any;
  constructor(path = ':memory:') {
    this.d = new DatabaseSync(path);
  }
  async execAsync(sql: string) {
    this.d.exec(sql);
  }
  async runAsync(sql: string, params: BindValue[] = []) {
    const r = this.d.prepare(sql).run(...params);
    return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
  }
  async getAllAsync<T>(sql: string, params: BindValue[] = []) {
    return this.d.prepare(sql).all(...params) as T[];
  }
  async getFirstAsync<T>(sql: string, params: BindValue[] = []) {
    return (this.d.prepare(sql).get(...params) ?? null) as T | null;
  }
  async withTransactionAsync(task: () => Promise<void>) {
    this.d.exec('BEGIN');
    try {
      await task();
      this.d.exec('COMMIT');
    } catch (e) {
      this.d.exec('ROLLBACK');
      throw e;
    }
  }
  close() {
    this.d.close();
  }
}
