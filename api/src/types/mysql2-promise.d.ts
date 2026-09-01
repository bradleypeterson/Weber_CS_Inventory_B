declare module "mysql2/promise" {
  export interface PoolConnection {
    query<T = any>(sql: string, values?: any): Promise<[T, any]>;
    execute<T = any>(sql: string, values?: any): Promise<[T, any]>;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    release(): void;
  }

  export interface Pool {
    query<T = any>(sql: string, values?: any): Promise<[T, any]>;
    execute<T = any>(sql: string, values?: any): Promise<[T, any]>;
    getConnection(): Promise<PoolConnection>;
    end(): Promise<void>;
  }

  export function createPool(options: any): Pool;
}

