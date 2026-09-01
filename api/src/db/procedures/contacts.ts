import type { RowDataPacket } from "mysql2";
import { pool } from "..";
import type { Contact, ContactOverview } from "../../../../@types/data";
import { CONTACT_ENTITY_TYPE, formatContactArchivedNote } from "../../contacts/contactSystemNotes";
import { addSystemNote } from "./systemNotes";

interface ContactRow extends RowDataPacket, ContactOverview {}
export async function getAllContacts() {
  try {
    const query = `SELECT 
                    p.PersonID,
                    WNumber, 
                    CONCAT(FirstName, " ", LastName) as FullName, 
                    GROUP_CONCAT(DISTINCT d.Abbreviation SEPARATOR ', ') as Departments, 
                    l.Barcode as Location,
                    JSON_ARRAYAGG(d.DepartmentID) as DepartmentID
                  FROM Person p 
                  JOIN PersonDepartment pd on pd.PersonID = p.PersonID 
                  JOIN Department d on d.DepartmentID = pd.DepartmentID
                  JOIN Location l on l.LocationID = p.LocationID
                  LEFT JOIN User u
                    ON u.PersonID = p.PersonID
                   AND (u.Deleted = 0 OR u.Deleted IS NULL)
                  WHERE (p.Deleted = 0 OR p.Deleted IS NULL)
                    AND u.UserID IS NULL
                  GROUP BY p.PersonID`;
    const [rows] = await pool.query<ContactRow[]>(query);
    return rows;
  } catch (error) {
    console.error(`Error in getAllContacts`, error);
    throw new Error("An error occurred while getting contacts");
  }
}

interface ContactDetailsRow extends RowDataPacket, Contact {}
export async function getContactDetails(personID: number): Promise<ContactDetailsRow | undefined> {
  try {
    const query = `
      SELECT 
        WNumber, 
        CONCAT(FirstName, " ", LastName) as FullName, 
        FirstName,
        LastName,
        l.LocationID,
        l.BuildingID,
        GROUP_CONCAT(d.Abbreviation SEPARATOR ', ') as Departments,
        JSON_ARRAYAGG(d.DepartmentID) as DepartmentID
      FROM Person p 
      JOIN PersonDepartment pd on pd.PersonID = p.PersonID 
      JOIN Department d on d.DepartmentID = pd.DepartmentID
      JOIN Location l on l.LocationID = p.LocationID
      LEFT JOIN User u
        ON u.PersonID = p.PersonID
       AND (u.Deleted = 0 OR u.Deleted IS NULL)
      WHERE p.PersonID = ?
        AND (p.Deleted = 0 OR p.Deleted IS NULL)
        AND u.UserID IS NULL
      GROUP BY p.PersonID, WNumber, FullName, FirstName, LastName, LocationID, BuildingID
                  `;
    const [rows] = await pool.query<ContactDetailsRow[]>(query, [personID.toString()]);
    const contact: ContactDetailsRow | undefined = rows[0];
    return contact;
  } catch (error) {
    console.error(`Error in getContactDetails`, error);
    throw new Error("An error occurred while getting contact details");
  }
}

export async function dbUpdateContact(
  personID: string, WNumber: string, FirstName: string, LastName:string,
  DepartmentID: number[], BuildingID: number, LocationID: number
  ) {

  try {
    const query = `
      UPDATE Person
        SET FirstName = ?, 
          LastName = ?,
          WNumber = ?,
          LocationID = ?
        WHERE PersonID = ?;
    `;
    await pool.query(query, [FirstName, LastName, WNumber, LocationID, personID]);

    const deptQuery = `
      INSERT IGNORE INTO PersonDepartment(PersonID, DepartmentID)
        VALUES(?, ?);
    `;    
    for (const element of DepartmentID) {
      await pool.query(deptQuery, [personID, element]);
    }

    const departmentRemoveQuery = `
        UPDATE PersonDepartment SET Deleted = 1
          WHERE PersonID = ? AND DepartmentID NOT IN (?);
      `;
      // Execute the query with userID and the permissions array
    await pool.query(departmentRemoveQuery, [personID, DepartmentID]);
      
  } catch (error) {
    console.log("Error in procedure");
    console.error(`Error in updateContact`, error);
    throw new Error("Database query failed while updating contact");
  }
}

interface PersonRow extends RowDataPacket {
  PersonID: number;
}

interface PersonIdRow extends RowDataPacket {
  PersonID: number;
}

export async function dbAddContact(
  WNumber: string, FirstName: string, LastName:string,
  DepartmentID: number[], BuildingID: number, LocationID: number
): Promise<number> {

  try {
    const query = `
      INSERT INTO Person(FirstName, LastName, WNumber, LocationID)
        VALUES (?,?,?,?);
    `;

    const idQuery = `SELECT PersonID from Person WHERE WNumber = ?;`;

    const deptQuery = `
      INSERT IGNORE INTO PersonDepartment(PersonID, DepartmentID)
        VALUES(?, ?);
    `;

    await pool.query(query, [FirstName, LastName, WNumber, LocationID]);

    //get personID
    const [rows] = await pool.query<PersonRow[]>(idQuery, [WNumber]);
    if (rows.length === 0) {
      throw new Error("PersonID not found after insertion");
    }
    const personID = rows[0].PersonID;

    for (const element of DepartmentID) {
      await pool.query(deptQuery, [personID, element]);
    }

    return personID;
  } catch (error) {
    console.log("Error in procedure");
    console.error(`Error in addContact`, error);
    throw new Error("Database query failed while adding contact");
  }
}

export async function getActivePersonIdsByIds(personIds: number[]): Promise<number[]> {
  if (personIds.length === 0) return [];
  try {
    const placeholders = personIds.map(() => "?").join(",");
    const query = `
      SELECT p.PersonID
      FROM Person p
      LEFT JOIN User u
        ON u.PersonID = p.PersonID
       AND (u.Deleted = 0 OR u.Deleted IS NULL)
      WHERE p.PersonID IN (${placeholders})
        AND (p.Deleted = 0 OR p.Deleted IS NULL)
        AND u.UserID IS NULL
    `;
    const [rows] = await pool.query<PersonIdRow[]>(query, personIds);
    return rows.map((row) => row.PersonID);
  } catch (error) {
    console.error(`Error in getActivePersonIdsByIds`, error);
    throw new Error("An error occurred while getting contacts by person IDs");
  }
}

export async function archiveContactsProcedure(performedByUserId: number, personIds: number[]) {
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

    const query = `UPDATE Person SET Deleted = 1 WHERE PersonID IN (?)`;
    await connection.query(query, [personIds]);

    for (const personID of personIds) {
      const note = formatContactArchivedNote(personID, wByPerson.get(personID));
      await addSystemNote(CONTACT_ENTITY_TYPE, personID, note, performedByUserId, "Deleted", connection);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in archiveContactsProcedure`, error);
    throw new Error("An error occurred while archiving contacts");
  } finally {
    connection.release();
  }
}
