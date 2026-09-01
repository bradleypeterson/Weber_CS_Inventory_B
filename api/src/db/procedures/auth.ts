import type { RowDataPacket } from "mysql2";
import { pool } from "..";

interface SaltRow extends RowDataPacket {
  Salt: string;
}

export async function getUserSalt(userId: string) {
  try {
    const query = `
      select Salt
      from User
      where UserID = ?
        and (Deleted = 0 or Deleted IS NULL)
    `;
    const [rows] = await pool.query<SaltRow[]>(query, [userId]);
    if (rows.length === 0) return null;
    return rows[0].Salt;
  } catch (error) {
    console.error(`Database error in getSaltByUsername: `, error);
    throw new Error("Database query failed");
  }
}

interface IdNumberRow extends RowDataPacket {
  UserID: string;
}

export async function getUserIDByWNumber(wNumber: string) {
  try {
    const query = `
    select UserID 
    from User u
    left join Person p on p.PersonID = u.PersonID
    where WNumber = ?
      and (u.Deleted = 0 or u.Deleted IS NULL)
      and (p.Deleted = 0 or p.Deleted IS NULL)
    `;
    const [rows] = await pool.query<IdNumberRow[]>(query, [wNumber]);
    if (rows.length === 0) return null;
    return rows[0].UserID.toString();
  } catch (error) {
    console.error(`Database error in getUserIDByWNumber: `, error);
    throw new Error("Database query failed");
  }
}

interface UserDetailsRow extends RowDataPacket {
  UserID: number;
  PersonID: number;
  HashedPassword?: string;
  Salt: string;
  Permissions: number[];
}

export async function getUserDetailsByWNumber(userId: string) {
  try {
    const query = `
      select 
        u.UserID as UserID,
        p.PersonID, HashedPassword,
        Salt,
        if(
          count(up.PermissionId) > 0, 
          JSON_ARRAYAGG(up.PermissionId), 
          JSON_ARRAY()
        ) AS Permissions
      from User u
      left join UserPermission up on u.UserID = up.UserID
      left join Person p on u.PersonID = p.PersonID
      where p.WNumber = ? 
        and (u.Deleted = 0 or u.Deleted IS NULL)
        and (p.Deleted = 0 or p.Deleted IS NULL)
      group by UserID, u.PersonID, HashedPassword, Salt
      limit 1
    `;

    const [rows] = await pool.query<UserDetailsRow[]>(query, [userId]);
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error(`Database error in getUserDetails: `, error);
    throw new Error("Database query failed");
  }
}

export async function getUserDetails(userId: string) {
  try {
    const query = `
      select 
        u.UserID as UserID,
        p.PersonID, HashedPassword,
        Salt,
        if(
          count(up.PermissionId) > 0, 
          JSON_ARRAYAGG(up.PermissionId), 
          JSON_ARRAY()
        ) AS Permissions
      from User u
      left join UserPermission up on u.UserID = up.UserID 
      left join Person p on p.PersonID = u.PersonID
      where u.UserID = ?
        and (u.Deleted = 0 or u.Deleted IS NULL)
        and (p.Deleted = 0 or p.Deleted IS NULL)
      group by u.UserID, p.PersonID, HashedPassword, Salt
      limit 1
    `;

    const [rows] = await pool.query<UserDetailsRow[]>(query, [userId]);
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error(`Database error in getUserDetails: `, error);
    throw new Error("Database query failed");
  }
}

export async function changePassword(userID: string, hashedNewPassword: string, newSalt: string) {
  try {
    const query = `
      UPDATE User SET HashedPassword = ?, Salt = ? WHERE UserID = ?;
    `;

    const [result] = await pool.query(query, [hashedNewPassword, newSalt, userID]);
  } catch (error) {
    console.error(`Database error in changePassword: `, error);
    throw new Error("Database query failed");
  }
}
