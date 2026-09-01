import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "..";
import type { User, UserOverview } from "../../../../@types/data";
import { USER_ENTITY_TYPE, formatUserArchivedNote } from "../../users/userSystemNotes";
import { changePassword } from "./auth";
import { addSystemNote } from "./systemNotes";

interface UserRow extends RowDataPacket, UserOverview {}
export async function getAllUsers() {
  try {
    const query = `
                  SELECT 
                    p.PersonID,
                    u.UserID,
                    WNumber, 
                    CONCAT(FirstName, " ", LastName) as Name, 
                    GROUP_CONCAT(DISTINCT d.Abbreviation SEPARATOR ', ') as Departments, 
                    l.Barcode as Location,
                    JSON_ARRAYAGG(d.DepartmentID) as DepartmentID,
                    (IF(JSON_CONTAINS(JSON_ARRAYAGG(up.PermissionID), "null"), JSON_ARRAY(0), JSON_ARRAYAGG(up.PermissionID)))  as Permissions
                  FROM Person p 
                  LEFT JOIN User u on u.PersonID = p.PersonID
                  LEFT JOIN UserPermission up on up.UserID = u.UserID
                  LEFT JOIN PersonDepartment pd on pd.PersonID = p.PersonID 
                  LEFT JOIN Department d on d.DepartmentID = pd.DepartmentID
                  LEFT JOIN Location l on l.LocationID = p.LocationID 
                  WHERE u.UserID IS NOT NULL
                    AND (p.Deleted = 0 OR p.Deleted IS NULL)
                    AND (u.Deleted = 0 OR u.Deleted IS NULL)
                  GROUP BY p.PersonID
                  `;
    const [rows] = await pool.query<UserRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllUsers`, error);
    throw new Error("An error occurred while getting users");
  }
}

interface UserDetailsRow extends RowDataPacket, User {}
export async function getUserDetails(personID: number): Promise<UserDetailsRow | undefined> {
  try {
    const query = `
      SELECT 
        u.UserID,   
        WNumber,
        CONCAT(FirstName, " ", LastName) as Name, 
        FirstName,
        LastName,
        l.BuildingID, 
        l.LocationID,
        GROUP_CONCAT(d.Abbreviation SEPARATOR ', ') as Departments,
        JSON_ARRAYAGG(d.DepartmentID) as DepartmentID,
        (IF(JSON_CONTAINS(JSON_ARRAYAGG(up.PermissionID), "null"), JSON_ARRAY(0), JSON_ARRAYAGG(up.PermissionID))) as Permissions,
        (SELECT Count(PermissionID) from UserPermission where PermissionID = 1 and UserID = u.UserID) as Permission1,
        (SELECT Count(PermissionID) from UserPermission where PermissionID = 2 and UserID = u.UserID) as Permission2,
        (SELECT Count(PermissionID) from UserPermission where PermissionID = 3 and UserID = u.UserID) as Permission3,
        (SELECT Count(PermissionID) from UserPermission where PermissionID = 4 and UserID = u.UserID) as Permission4,
        (SELECT Count(PermissionID) from UserPermission where PermissionID = 5 and UserID = u.UserID) as Permission5,
        (SELECT Count(PermissionID) from UserPermission where PermissionID = 6 and UserID = u.UserID) as Permission6,
        (SELECT Count(PermissionID) from UserPermission where PermissionID = 7 and UserID = u.UserID) as Permission7
      FROM Person p 
      LEFT JOIN User u on u.PersonID = p.PersonID
      LEFT JOIN UserPermission up on up.UserID = u.UserID
      LEFT JOIN PersonDepartment pd on pd.PersonID = p.PersonID 
      LEFT JOIN Department d on d.DepartmentID = pd.DepartmentID
      LEFT JOIN Location l on l.LocationID = p.LocationID 
      LEFT JOIN Building b on l.BuildingID = b.BuildingID
      WHERE p.PersonID = ?
        AND u.UserID IS NOT NULL
        AND (p.Deleted = 0 OR p.Deleted IS NULL)
        AND (u.Deleted = 0 OR u.Deleted IS NULL)
      GROUP BY p.PersonID
                  `;
    const [rows] = await pool.query<UserDetailsRow[]>(query, [personID.toString()]);
    const user: UserDetailsRow | undefined = rows[0];
    console.log(user)
    return user;
  } catch (error) {
    console.error(`Error in getUserDetails`, error);
    throw new Error("An error occurred while getting user details");
  }
}

interface UserIDRow extends RowDataPacket {
  UserID: number;
}

export async function dbUpdateUser(
  personID: number,
  updates: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  try {
    const updateQuery = `
      UPDATE Person
        SET FirstName = ?, 
          LastName = ?,
          WNumber = ?,
          LocationID = ?
        WHERE PersonID = ?;
    `;
    await pool.query(updateQuery, [updates.FirstName, updates.LastName, updates.WNumber, updates.LocationID, personID]);

    const deptQuery = `
      INSERT IGNORE INTO PersonDepartment(PersonID, DepartmentID)
        VALUES(?, ?);
    `;
    if (Array.isArray(updates.DepartmentID)) {
      for (const departmentID of updates.DepartmentID) {
        await pool.query(deptQuery, [personID, departmentID]);
      }
    }

    const departmentRemoveQuery = `
        UPDATE PersonDepartment SET Deleted = 1
          WHERE PersonID = ? AND DepartmentID NOT IN (?);
      `;
      // Execute the query with userID and the permissions array
      if (Array.isArray(updates.DepartmentID)){
        await pool.query(departmentRemoveQuery, [personID, updates.DepartmentID]);
      }

    const userIdQuery = `
      SELECT UserID
        FROM User
        WHERE PersonID = ?;
    `;
    const [rows] = await pool.query<UserIDRow[]>(userIdQuery, [personID]);
        if (rows.length === 0) {
          throw new Error("UserID not found after insertion");
        }
        const userID = rows[0].UserID;

    const permissionsInsertQuery =`
      INSERT IGNORE INTO UserPermission(UserID, PermissionID)
        VALUES (?, ?);
    `;
    if (Array.isArray(updates.Permissions)) {
      for (const permissionID of updates.Permissions) {
        await pool.query(permissionsInsertQuery, [userID, permissionID]);
      }
    }
     
    if (Array.isArray(updates.Permissions) && updates.Permissions.length > 0) {
      const placeholders = updates.Permissions.map(() => '?').join(','); // Create placeholders for the array
      
      const permissionsRemoveQuery = `
        DELETE FROM UserPermission
        WHERE UserID = ? AND PermissionID NOT IN (${placeholders});
      `;
      // Execute the query with userID and the permissions array
      await pool.query(permissionsRemoveQuery, [userID, ...updates.Permissions]);
    } else {
      // If no permissions are provided, delete all permissions for the user
      const permissionsRemoveQuery = `
        DELETE FROM UserPermission
        WHERE UserID = ?;
      `;
      await pool.query(permissionsRemoveQuery, [userID]);
      console.log("All permissions removed for UserID:", userID);
    }

  } catch (error) {
    console.error(`Error in updateUser`, error);
    throw new Error("An error occurred while updating user");
  }
}

interface PersonRow extends RowDataPacket {
  PersonID: number;
}

interface DepartmentIdRow extends RowDataPacket {
  DepartmentID: number;
}

interface PersonIdRow extends RowDataPacket {
  PersonID: number;
}

export async function getDepartmentIDsByPersonID(personID: number): Promise<number[]> {
  try {
    const query = `
      SELECT DepartmentID
      FROM PersonDepartment
      WHERE PersonID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
    `;

    const [rows] = await pool.query<DepartmentIdRow[]>(query, [personID]);
    return rows.map((row) => row.DepartmentID);
  } catch (error) {
    console.error(`Error in getDepartmentIDsByPersonID`, error);
    throw new Error("An error occurred while getting person departments");
  }
}

export async function dbAddUser(
  details: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
): Promise<number> {
  try {
    const query = `
      INSERT INTO Person(FirstName, LastName, WNumber, LocationID)
        VALUES (?,?,?,?);
    `;
    await pool.query(query, [details.FirstName, details.LastName, details.WNumber, 
      details.BuildingID, details.LocationID]);
    
    //get personID
    const idQuery = `SELECT PersonID from Person WHERE WNumber = ?;`;
    const [personRows] = await pool.query<PersonRow[]>(idQuery, [details.WNumber]);
    if (personRows.length === 0) {
      throw new Error("PersonID not found after insertion");
    }
    const personID = personRows[0].PersonID;

    const deptQuery = `
      INSERT IGNORE INTO PersonDepartment(PersonID, DepartmentID)
        VALUES(?, ?);
    `;
    if (Array.isArray(details.DepartmentID)) {
      for (const departmentID of details.DepartmentID) {
        await pool.query(deptQuery, [personID, departmentID]);
      }
    }

    const queryUser = `
    INSERT INTO User(PersonID, HashedPassword, Salt)
      VALUES (?,?,?);
    `;
    await pool.query(queryUser, [personID, details.hashedNewPassword, details.Salt]);
      
    const userIdQuery = `
      SELECT UserID
        FROM User
        WHERE PersonID = ?;
    `;
    const [rows] = await pool.query<UserIDRow[]>(userIdQuery, [personID]);
      if (rows.length === 0) {
        throw new Error("UserID not found after insertion");
      }
    const userID = rows[0].UserID;

    const permissionsInsertQuery =`
      INSERT IGNORE INTO UserPermission(UserID, PermissionID)
        VALUES (?, ?);
    `;
    if (Array.isArray(details.Permissions)) {
      for (const permissionID of details.Permissions) {
        await pool.query(permissionsInsertQuery, [userID, permissionID]);
      }
    }
  
    if (typeof details.Salt === "string" && typeof details.hashedNewPassword === "string") {
      await changePassword(userID.toString(), details.hashedNewPassword, details.Salt);
    } else {
      console.error("Invalid Salt value: must be a string");
      throw new Error("Invalid Salt value");
    }

    return personID;
  } catch (error) {
    console.error(`Error in updateUser`, error);
    throw new Error("An error occurred while updating user");
  }
}

export async function dbPromoteContactToUser(
  details: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const personID = Number(details.personID);
    if (Number.isNaN(personID)) {
      throw new Error("INVALID_PERSON_ID");
    }

    const [personRows] = await connection.query<PersonRow[]>(
      `
      SELECT PersonID
      FROM Person
      WHERE PersonID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
      LIMIT 1;
      `,
      [personID]
    );
    if (personRows.length === 0) {
      throw new Error("PERSON_NOT_FOUND");
    }

    const [activeUserRows] = await connection.query<UserIDRow[]>(
      `
      SELECT UserID
      FROM User
      WHERE PersonID = ?
        AND (Deleted = 0 OR Deleted IS NULL)
      LIMIT 1;
      `,
      [personID]
    );
    if (activeUserRows.length > 0) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    await connection.query(
      `
      UPDATE Person
      SET FirstName = ?,
          LastName = ?,
          WNumber = ?,
          LocationID = ?
      WHERE PersonID = ?;
      `,
      [details.FirstName, details.LastName, details.WNumber, details.LocationID, personID]
    );

    if (Array.isArray(details.DepartmentID)) {
      for (const departmentID of details.DepartmentID) {
        await connection.query(
          `
          INSERT INTO PersonDepartment(PersonID, DepartmentID, Deleted)
          VALUES(?, ?, 0)
          ON DUPLICATE KEY UPDATE Deleted = 0, LastUpdated = NOW();
          `,
          [personID, departmentID]
        );
      }
    }

    if (Array.isArray(details.DepartmentID) && details.DepartmentID.length > 0) {
      await connection.query(
        `
        UPDATE PersonDepartment
        SET Deleted = 1
        WHERE PersonID = ?
          AND DepartmentID NOT IN (?);
        `,
        [personID, details.DepartmentID]
      );
    } else {
      await connection.query(
        `
        UPDATE PersonDepartment
        SET Deleted = 1
        WHERE PersonID = ?;
        `,
        [personID]
      );
    }

    const [userInsertResult] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO User(PersonID, HashedPassword, Salt)
      VALUES (?, ?, ?);
      `,
      [personID, details.hashedNewPassword, details.Salt]
    );
    const userID = userInsertResult.insertId;

    if (Array.isArray(details.Permissions)) {
      for (const permissionID of details.Permissions) {
        await connection.query(
          `
          INSERT IGNORE INTO UserPermission(UserID, PermissionID)
          VALUES (?, ?);
          `,
          [userID, permissionID]
        );
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in dbPromoteContactToUser`, error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function getActiveUserPersonIdsByIds(personIds: number[]): Promise<number[]> {
  if (personIds.length === 0) return [];
  try {
    const placeholders = personIds.map(() => "?").join(",");
    const query = `
      SELECT p.PersonID
      FROM Person p
      JOIN User u ON u.PersonID = p.PersonID
      WHERE p.PersonID IN (${placeholders})
        AND (p.Deleted = 0 OR p.Deleted IS NULL)
        AND (u.Deleted = 0 OR u.Deleted IS NULL)
    `;
    const [rows] = await pool.query<PersonIdRow[]>(query, personIds);
    return rows.map((row) => row.PersonID);
  } catch (error) {
    console.error(`Error in getActiveUserPersonIdsByIds`, error);
    throw new Error("An error occurred while getting users by person IDs");
  }
}

export async function archiveUsersProcedure(performedByUserId: number, personIds: number[]) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [personRows] = await connection.query<RowDataPacket[]>(
      `SELECT PersonID, WNumber FROM Person WHERE PersonID IN (?) AND (Deleted = 0 OR Deleted IS NULL)`,
      [personIds]
    );
    const wByPerson = new Map<number, string | null>();
    for (const row of personRows) {
      wByPerson.set(Number(row.PersonID), row.WNumber != null ? String(row.WNumber) : null);
    }

    const updateUsersQuery = `UPDATE User SET Deleted = 1 WHERE PersonID IN (?)`;
    await connection.query(updateUsersQuery, [personIds]);

    const updatePersonsQuery = `UPDATE Person SET Deleted = 1 WHERE PersonID IN (?)`;
    await connection.query(updatePersonsQuery, [personIds]);

    for (const personID of personIds) {
      const note = formatUserArchivedNote(personID, wByPerson.get(personID));
      await addSystemNote(USER_ENTITY_TYPE, personID, note, performedByUserId, "Deleted", connection);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in archiveUsersProcedure`, error);
    throw new Error("An error occurred while archiving users");
  } finally {
    connection.release();
  }
}
