declare module "mysql2" {
  // Minimal types needed by this codebase.
  export interface RowDataPacket {
    // Use any here to avoid propagating `unknown` throughout query results.
    [column: string]: any;
  }

  export interface ResultSetHeader {
    insertId: number;
    affectedRows: number;
    changedRows: number;
  }
}

