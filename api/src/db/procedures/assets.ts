import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool, PoolConnection } from "mysql2/promise";
import { pool } from "..";
import type { Asset, AssetDetails, AssetOverview, Condition, DeviceType, Note } from "../../../../@types/data";
import { EQUIPMENT_ENTITY_TYPE, formatEquipmentArchivedNote } from "../../assets/equipmentSystemNotes";
import { addSystemNote } from "./systemNotes";

interface AssetRow extends RowDataPacket, Asset {}

function getDepartmentScopeSql(departmentIds?: number[]) {
  if (departmentIds === undefined) return { clause: "", values: [] as number[] };
  if (departmentIds.length === 0) return { clause: " AND 1 = 0", values: [] as number[] };

  const placeholders = departmentIds.map(() => "?").join(",");
  return {
    clause: ` AND DepartmentID IN (${placeholders})`,
    values: departmentIds
  };
}

export async function getAllAssets(departmentIds?: number[]) {
  try {
    const scope = getDepartmentScopeSql(departmentIds);
    const query = `
      SELECT 
        EquipmentID,
        TagNumber,
        SerialNumber,
        Description,
        ContactPersonID,
        LocationID,
        DepartmentID,
        AssetClassID,
        FiscalYearID,
        ConditionID,
        DeviceTypeID,
        Manufacturer,
        PartNumber,
        Rapid7,
        CrowdStrike,
        ArchiveStatus,
        PONumber,
        SecondaryNumber,
        AccountingDate,
        CAST(AccountCost AS FLOAT) AS AccountCost
      FROM Equipment
      WHERE 1 = 1 ${scope.clause};
    `;
    const [rows] = await pool.query<AssetRow[]>(query, scope.values);
    return rows;
  } catch (error) {
    console.error(`Error in getAllAssets`, error);
    throw new Error("An error occurred while getting assets");
  }
}

interface AssetDetailsRow extends RowDataPacket, AssetDetails {}
export async function getAssetDetails(assetId: number, departmentIds?: number[]): Promise<AssetDetailsRow | undefined> {
  try {
    const scope = getDepartmentScopeSql(departmentIds);
    const query = `
    SELECT 
      a.EquipmentID,
      a.TagNumber,
      a.SerialNumber,
      a.Description,
      d.DepartmentID,
      d.Name as DepartmentName,
      b.BuildingID as BuildingID,
      l.LocationID,
      l.RoomNumber,
      l.Barcode,
      b.Name as BuildingName,
      b.Abbreviation as BuildingAbbr,
      a.ContactPersonID,
      c.FirstName as ContactPersonFirstName,
      c.LastName as ContactPersonLastName,
      ac.AssetClassID,
      ac.Name as AssetClassName,
      f.ReplacementID as FiscalYearID,
      f.Year as FiscalYear,
      cond.ConditionID,
      cond.ConditionName,
      dt.DeviceTypeID,
      dt.Name as DeviceTypeName,
      a.Manufacturer,
      a.PartNumber,
      a.Rapid7,
      a.CrowdStrike,
      a.ArchiveStatus,
      a.PONumber,
      a.SecondaryNumber,
      a.AccountingDate,
      CAST(AccountCost AS FLOAT) AS AccountCost
    FROM Equipment a
    LEFT JOIN Department d ON a.DepartmentID = d.DepartmentID
    LEFT JOIN Location l ON a.LocationID = l.LocationID
    LEFT JOIN Building b on l.BuildingID = b.BuildingID 
    LEFT JOIN Person c ON a.ContactPersonID = c.PersonID
    LEFT JOIN AssetClass ac ON a.AssetClassID = ac.AssetClassID
    LEFT JOIN ReplacementFiscalYear f ON a.FiscalYearID = f.ReplacementID
    LEFT JOIN \`Condition\` cond ON a.ConditionID = cond.ConditionID
    LEFT JOIN DeviceType dt ON a.DeviceTypeID = dt.DeviceTypeID
    WHERE a.EquipmentID = ?
      ${scope.clause.replaceAll("DepartmentID", "a.DepartmentID")}
    LIMIT 1;
  `;

    const [rows] = await pool.query<AssetDetailsRow[]>(query, [assetId, ...scope.values]);
    const asset: AssetDetailsRow | undefined = rows[0];
    return asset;
  } catch (error) {
    console.error(`Error in getAssetDetails`, error);
    throw new Error("An error occurred while getting asset details");
  }
}

interface AssetIdentifierRow extends RowDataPacket {
  EquipmentID: number;
}

export async function getAssetIdByTagNumber(tagNumber: string, departmentIds?: number[]) {
  try {
    const scope = getDepartmentScopeSql(departmentIds);
    const query = `
      SELECT EquipmentID
      FROM Equipment
      WHERE TagNumber = ?
      ${scope.clause}
      LIMIT 1
    `;

    const [rows] = await pool.query<AssetIdentifierRow[]>(query, [tagNumber, ...scope.values]);
    return rows[0]?.EquipmentID;
  } catch (error) {
    console.error(`Error in getAssetIdByTagNumber`, error);
    throw new Error("An error occurred while getting asset by tag number");
  }
}

export async function getAssetDetailsByIds(ids: number[], departmentIds?: number[]): Promise<AssetDetailsRow[]> {
  if (ids.length === 0) return [];
  try {
    const scope = getDepartmentScopeSql(departmentIds);
    const placeholders = ids.map(() => "?").join(",");
    const query = `
    SELECT 
      a.EquipmentID,
      a.TagNumber,
      a.SerialNumber,
      a.Description,
      d.DepartmentID,
      d.Name as DepartmentName,
      b.BuildingID as BuildingID,
      l.LocationID,
      l.RoomNumber,
      l.Barcode,
      b.Name as BuildingName,
      b.Abbreviation as BuildingAbbr,
      a.ContactPersonID,
      c.FirstName as ContactPersonFirstName,
      c.LastName as ContactPersonLastName,
      ac.AssetClassID,
      ac.Name as AssetClassName,
      f.ReplacementID as FiscalYearID,
      f.Year as FiscalYear,
      cond.ConditionID,
      cond.ConditionName,
      dt.DeviceTypeID,
      dt.Name as DeviceTypeName,
      a.Manufacturer,
      a.PartNumber,
      a.Rapid7,
      a.CrowdStrike,
      a.ArchiveStatus,
      a.PONumber,
      a.SecondaryNumber,
      a.AccountingDate,
      CAST(a.AccountCost AS FLOAT) AS AccountCost
    FROM Equipment a
    LEFT JOIN Department d ON a.DepartmentID = d.DepartmentID
    LEFT JOIN Location l ON a.LocationID = l.LocationID
    LEFT JOIN Building b on l.BuildingID = b.BuildingID 
    LEFT JOIN Person c ON a.ContactPersonID = c.PersonID
    LEFT JOIN AssetClass ac ON a.AssetClassID = ac.AssetClassID
    LEFT JOIN ReplacementFiscalYear f ON a.FiscalYearID = f.ReplacementID
    LEFT JOIN \`Condition\` cond ON a.ConditionID = cond.ConditionID
    LEFT JOIN DeviceType dt ON a.DeviceTypeID = dt.DeviceTypeID
    WHERE a.EquipmentID IN (${placeholders})
      AND (a.Deleted = 0 OR a.Deleted IS NULL)
      ${scope.clause.replaceAll("DepartmentID", "a.DepartmentID")};
  `;
    const [rows] = await pool.query<AssetDetailsRow[]>(query, [...ids, ...scope.values]);
    return rows;
  } catch (error) {
    console.error(`Error in getAssetDetailsByIds`, error);
    throw new Error("An error occurred while getting asset details");
  }
}

interface AssetOverviewRow extends RowDataPacket, AssetOverview {}
export async function getAllAssetsOverview(departmentIds?: number[]) {
  try {
    const scope = getDepartmentScopeSql(departmentIds);
    const query = `
      select 
        EquipmentID,
        TagNumber,
        p.FirstName as ContactPersonFirstName,
        p.LastName as ContactPersonLastName,
        e.DepartmentID,
        d.Name as Department,
        e.AssetClassID,
        ac.Name as AssetClass,
        e.DeviceTypeID,
        dt.Name as DeviceType
      from Equipment e 
      left join Person p on e.ContactPersonID = p.PersonID 
      left join Department d on d.DepartmentID = e.DepartmentID
      left join AssetClass ac on ac.AssetClassID = e.AssetClassID 
      left join DeviceType dt on dt.DeviceTypeID = e.DeviceTypeID 
      left join \`Condition\` c on c.ConditionID = e.ConditionID 
      where ArchiveStatus = 0
      ${scope.clause.replaceAll("DepartmentID", "e.DepartmentID")}
    `;
    const [rows] = await pool.query<AssetOverviewRow[]>(query, scope.values);
    return rows;
  } catch (error) {
    console.error(`Error in getAllAssetsOverview`, error);
    throw new Error("An error occurred while getting assets");
  }
}

export async function dbUpdateAsset(
  assetId: number,
  updates: Record<string, string | string[] | (string | number)[] | number[] | boolean | number | null>
) {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`\`${key}\` = ?`);
      values.push(value);
    }

    const query = `
      update Equipment
      set ${setClauses.join(", ")}
      where EquipmentID = ?
    `;

    values.push(assetId);

    await pool.query(query, values);
  } catch (error) {
    console.error(`Error in updateAsset`, error);
    throw new Error("An error occurred while updating asset.");
  }
}

interface ConditionRow extends RowDataPacket, Condition {}
export async function getAllConditions() {
  try {
    const query = `
      SELECT ConditionID, ConditionName, ConditionAbbreviation
      FROM \`Condition\`
      WHERE (Deleted = 0 OR Deleted IS NULL)
    `;

    const [rows] = await pool.query<ConditionRow[]>(query);

    return rows;
  } catch (error) {
    console.error(`Error in getAllConditions`, error);
    throw new Error("An error occurred while getting conditions.");
  }
}

interface DeviceTypeRow extends RowDataPacket, DeviceType {}
export async function getAllDeviceTypes() {
  try {
    const query = `
      SELECT DeviceTypeID, Name, Abbreviation
      FROM DeviceType
      WHERE (Deleted = 0 OR Deleted IS NULL)
    `;

    const [rows] = await pool.query<DeviceTypeRow[]>(query);

    return rows;
  } catch (error) {
    console.error(`Error in getAllDeviceTypes`, error);
    throw new Error("An error occurred while getting device types.");
  }
}

export type AddAssetParams = {
  // --- Core ---
  TagNumber: string;
  SerialNumber?: string | null;
  Description?: string | null;
  ContactPersonID?: number | null;
  LocationID?: number | null;
  DepartmentID?: number | null;
  AssetClassID?: number | null;
  FiscalYearID?: number | null;
  ConditionID?: number | null;
  DeviceTypeID?: number | null;
  Manufacturer?: string | null;
  PartNumber?: string | null;
  Rapid7?: boolean | null;
  CrowdStrike?: boolean | null;
  ArchiveStatus?: boolean | null;
  PONumber?: string | null;
  SecondaryNumber?: string | null;
  AccountingDate?: string | null;
  AccountCost?: number | null;

  // --- Asset / Equipment Details ---
  Model?: string | null;
  Make?: string | null;
  AssetType?: string | null;
  AssetCreationDate?: string | null;
  LastValidationDate?: string | null;

  // --- Acquisition / Accounting ---
  AcqCost?: number | null;
  AcqDate?: string | null;
  AcqMethod?: string | null;
  TotalCost?: number | null;
  EstReplacementCost?: number | null;

  // --- Department ---
  DeptNum?: string | null;
};

type QueryableDb = Pool | PoolConnection;

export async function addAsset(params: AddAssetParams, db: QueryableDb = pool): Promise<ResultSetHeader> {
  try {
    const query = `
      INSERT INTO Equipment (
        TagNumber, SerialNumber, Description,
        ContactPersonID, LocationID, DepartmentID,
        AssetClassID, FiscalYearID, ConditionID, DeviceTypeID,
        Manufacturer, PartNumber,
        Rapid7, CrowdStrike, ArchiveStatus,
        PONumber, SecondaryNumber,
        AccountingDate, AccountCost,
        Model, Make, AssetType, AssetCreationDate, LastValidationDate,
        AcqCost, AcqDate, AcqMethod,
        TotalCost, EstReplacementCost,
        DeptNum
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?
      );
    `;

    const values = [
      params.TagNumber,
      params.SerialNumber           ?? null,
      params.Description            ?? null,
      params.ContactPersonID        ?? null,
      params.LocationID             ?? null,
      params.DepartmentID           ?? null,
      params.AssetClassID           ?? null,
      params.FiscalYearID           ?? null,
      params.ConditionID            ?? null,
      params.DeviceTypeID           ?? null,
      params.Manufacturer           ?? null,
      params.PartNumber             ?? null,
      params.Rapid7                 ?? false,
      params.CrowdStrike            ?? false,
      params.ArchiveStatus          ?? false,
      params.PONumber               ?? null,
      params.SecondaryNumber        ?? null,
      params.AccountingDate         ?? null,
      params.AccountCost            ?? null,
      // Asset / Equipment Details
      params.Model                  ?? null,
      params.Make                   ?? null,
      params.AssetType              ?? null,
      params.AssetCreationDate      ?? null,
      params.LastValidationDate     ?? null,
      // Acquisition / Accounting
      params.AcqCost                ?? null,
      params.AcqDate                ?? null,
      params.AcqMethod              ?? null,
      params.TotalCost              ?? null,
      params.EstReplacementCost     ?? null,
      // Department
      params.DeptNum                ?? null,
    ];

    const [result] = await db.query<ResultSetHeader>(query, values);
    return result;
  } catch (error) {
    console.error(`Error in addAsset`, error);
    throw new Error("An error occurred while adding an asset.");
  }
}

interface AssetNotesRow extends RowDataPacket, Note {}
export async function getAssetNotes(assetId: number) {
  try {
    const query = `
      select NoteID, CreatedBy, EquipmentID, Note, CreatedAt
      from Note where EquipmentID = ?
    `;

    const [rows] = await pool.query<AssetNotesRow[]>(query, [assetId]);

    return rows;
  } catch (error) {
    console.error(`Error in getAssetNotes`, error);
    throw new Error("An error occurred while getting notes.");
  }
}

export async function addAssetNote(
  userId: number,
  assetId: number,
  note: string,
  db: QueryableDb = pool
): Promise<ResultSetHeader> {
  try {
    const query = `
      insert into Note
      (CreatedBy, EquipmentID, Note, CreatedAt)
      values
      (?,?,?, now())
    `;

    const [result] = await db.query<ResultSetHeader>(query, [userId, assetId, note]);
    return result;
  } catch (error) {
    console.error(`Error in addAssetNote`, error);
    throw new Error("An error occurred while adding note.");
  }
}

export async function archiveAssetsProcedure(userId: number, assetIds: number[]) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [tagRows] = await connection.query<RowDataPacket[]>(
      `SELECT EquipmentID, TagNumber FROM Equipment WHERE EquipmentID IN (?) AND (Deleted = 0 OR Deleted IS NULL)`,
      [assetIds]
    );
    const tagById = new Map<number, string | null>();
    for (const row of tagRows) {
      tagById.set(Number(row.EquipmentID), row.TagNumber != null ? String(row.TagNumber) : null);
    }

    const archiveInsertQuery = `insert into Archive (ArchivedBy, EquipmentID) values ?`;
    const archiveValues = assetIds.map((id) => [userId, id]);
    await connection.query(archiveInsertQuery, [archiveValues]);

    const updateEquipmentQuery = `update Equipment set ArchiveStatus = 1 where EquipmentId in (?)`;
    await connection.query(updateEquipmentQuery, [assetIds]);

    for (const id of assetIds) {
      const note = formatEquipmentArchivedNote(id, tagById.get(id));
      await addSystemNote(EQUIPMENT_ENTITY_TYPE, id, note, userId, "Deleted", connection);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`Error in archiveAssetsProcedure`, error);
    throw new Error("An error occurred while archiving assets");
  } finally {
    connection.release();
  }
}