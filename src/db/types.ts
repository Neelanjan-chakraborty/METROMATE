export type BindValue = string | number | null;

/**
 * The slice of expo-sqlite's SQLiteDatabase that the repository needs. Keeping
 * it small lets the same code run against Node's built-in SQLite in tests.
 */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: BindValue[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, params?: BindValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: BindValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
