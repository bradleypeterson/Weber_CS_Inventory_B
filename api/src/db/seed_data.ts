import { DB_NAME, pool } from "./index";

async function seedDatabase() {
  try {
    await pool.query(`USE ${DB_NAME};`);

    await pool.query(
      `INSERT INTO ReplacementFiscalYear(Year) VALUES 
        ('2025-2026'),
        ('2026-2027'),
        ('2027-2028');
        `
    );

    await pool.query(
      `INSERT INTO Building(Name, Abbreviation) VALUES
        ('Noorda Engineering, Applied Science & Technology', 'NB'),
        ('Elizabeth Hall', 'EH'),
        ('Engineering Technology', 'ET'),
        ('Davis Building 2', 'D2'),
        ('Davis Building 3', 'D3'),
        ('Davis Comp & Auto Eng Bldg', 'DA'),
        ('Computer Automation Engineering', 'CAE'),
        ('Davis Stewart Center', 'DSC'),
        ('Center for Continuing Education', 'CCE'),
        ('Building D13', 'D13'),
        ('Marriot Building', 'MB'),
        ('Hurst Building', 'HB'),
        ('Hurst Center', 'HC'),
        ('Other', 'OTH');
        `
    );

    await pool.query(
      `INSERT INTO DeviceType(Name, Abbreviation) VALUES 
        ('Digital Camera', 'DC'),
        ('Laptop/Notebook', 'LT'),
        ('Other', 'OT'),
        ('Personal Computer', 'PC'),
        ('Projector', 'PJ'),
        ('Printer', 'PR'),
        ('Tablet', 'TA'),
        ('TV(any type)', 'TV'),
        ('Virtual Computer Device', 'VC');
        `
    );

    await pool.query(
      `INSERT INTO \`Condition\` (ConditionName, ConditionAbbreviation) VALUES 
        ('New', 'NW'),
        ('Excellent', 'EX'),
        ('Good', 'GD'),
        ('Fair', 'FR'),
        ('Poor', 'PR'),
        ('Dead/Parts', 'DD'),
        ('Obsolete', 'OB');
        `
    );

    await pool.query(
      `INSERT INTO AuditStatus(StatusName) VALUES 
        ('found'),
        ('damaged'),
        ('missing'),
        ('turned-in');
        `
    );

    await pool.query(
      `INSERT INTO AssetClass(Name, Abbreviation) VALUES 
        ('Art Objects', 'AV'),
        ('AudioVisual and Projection Equipment', 'CE'),
        ('Computer Equipment and Peripherals', 'CP'),
        ('General Equipment', 'EQ'),
        ('Infrastructure', 'IT'),
        ('Shop and Maintenance Equipment', 'SH'),
        ('Vehicles', 'VH'),
        ('Vehicles Not Owned', 'VN'),
        ('SOFTWARE-DATA PROCESSING', 'SW');
        `
    );

    await pool.query(
      `INSERT INTO Department(Name, Abbreviation) VALUES
        ('School of Computing', 'SOC'),
        ('Computer Science', 'CS'),
        ('Cybersecurity and Network Management', 'NET'),
        ('Web and User Experience', 'WEB');
        `
    );

    await pool.query(
      `INSERT INTO Location(BuildingID, RoomNumber, Barcode) VALUES 
        (1, '101', 'NB101'),
        (2, '102', 'EH101'),
        (3, '101', 'ET101'),
        (4, '101', 'D2101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '115', 'D2115'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '116', 'D2116'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '205', 'D2205'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '206', 'D2206'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '207', 'D2207'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '208', 'D2208'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '214', 'D2214'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '220', 'D2220'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '231', 'D2231'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '241', 'D2241'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '256', 'D2256'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '262', 'D2262'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '307', 'D2307'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D3' LIMIT 1), '201', 'D3201'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '104', 'DSC104'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '105', 'DSC105'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '106', 'DSC106'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '107', 'DSC107'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '108', 'DSC108'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '109', 'DSC109'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '122', 'DSC122'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '124', 'DSC124'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '130', 'DSC130'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '221', 'DSC221'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '231', 'DSC231'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CAE' LIMIT 1), '106', 'CAE106');
        `
    );

    await pool.query(
      `INSERT INTO Person(Wnumber, FirstName, LastName, LocationID) VALUES
        ('W01111111', 'Matt', 'Western', 1),
        ('W01111112', 'Maria', 'Bennett', 2),
        ('W01111113', 'Ben', 'Cash', 3),
        ('W01111114', 'Josh', 'Morgan', 4),
        ('W01111115', 'Patrick', 'Beck', (SELECT LocationID FROM Location WHERE Barcode = 'CAE106' LIMIT 1));
        `
    );

    await pool.query(
      `INSERT INTO User(PersonID, HashedPassword, Salt) VALUES
        (1, '6386b1dfb33a3a4439e15e45363d4ab3c51a8fa758086d9a51670834a78f8bbf','2cef97f7a9744f60ceb9f93839e09929'),
        (2, '6386b1dfb33a3a4439e15e45363d4ab3c51a8fa758086d9a51670834a78f8bbf','2cef97f7a9744f60ceb9f93839e09929'),
        (3, '6386b1dfb33a3a4439e15e45363d4ab3c51a8fa758086d9a51670834a78f8bbf','2cef97f7a9744f60ceb9f93839e09929'),
        (4, '6386b1dfb33a3a4439e15e45363d4ab3c51a8fa758086d9a51670834a78f8bbf','2cef97f7a9744f60ceb9f93839e09929'),
        ((SELECT PersonID FROM Person WHERE WNumber = 'W01111115' LIMIT 1), '6386b1dfb33a3a4439e15e45363d4ab3c51a8fa758086d9a51670834a78f8bbf', '2cef97f7a9744f60ceb9f93839e09929');
        `
    );

    await pool.query(
      `INSERT INTO Permission (Name, Description) VALUES
        ('Add/Edit Assets', 'Add/Edit Assets'),
        ('Archive Assets', 'Archive Assets'),
        ('Import CSV Data', 'Import CSV Data'),
        ('Add/Edit Contact Persons', 'Add/Edit Contact Persons'),
        ('Add/Edit List Options', 'Add/Edit List Options'),
        ('Add/Edit/View Users', 'Add/Edit/View Users including changing user passwords'),
        ('Set User Permissions', 'Set User Permissions');
        `
    );

    await pool.query(
      `INSERT INTO UserPermission(UserID, PermissionID)
       VALUES (2,1), (3,1), (4,1);

      INSERT INTO UserPermission(UserID, PermissionID)
      SELECT u.UserID, 1
      FROM User u
      JOIN Person p on p.PersonID = u.PersonID
      WHERE p.WNumber = 'W01111115';
      
      INSERT INTO UserPermission(UserID, PermissionID)
      select UserID, PermissionID 
      from \`User\` u
      cross join Permission p 
      where UserID = 1
      order by UserId;
      `
    );

    await pool.query(
      `INSERT INTO PersonDepartment(PersonID, DepartmentID) VALUES 
        (1,1),
        (2,2),
        (3,3),
        (4,4),
        ((SELECT PersonID FROM Person WHERE WNumber = 'W01111115' LIMIT 1), 1);
        `
    );

    await pool.query(
      `INSERT INTO Equipment(TagNumber, SerialNumber, Description, ContactPersonID, LocationID, DepartmentID, AssetClassID, FiscalYearID, ConditionID, DeviceTypeID, Manufacturer, PartNumber, Rapid7, CrowdStrike, ArchiveStatus, PONumber, SecondaryNumber, AccountingDate, AccountCost) VALUES
        ('1', '1', 'Laptop', 1, 1, 1, 3, 1, 1, 2, 'Dell', '1', TRUE, TRUE, FALSE, '1', '1', '2025-01-01', 1000),
        ('2', '2', 'TV', 2, 2, 2, 1, 1, 2, 8, 'Samsung', '2', FALSE, FALSE, FALSE, '2', '2', '2025-01-01', 800),
        ('3', '3', 'Projector', 1, 1, 1, 2, 1, 5, 7, 'Samsung', '3', FALSE, FALSE, TRUE, '3', '3', '2024-01-01', 200);
        `
    );

    await pool.query(
      `INSERT INTO Archive (ArchivedBy, EquipmentID, ArchivedDate) VALUES
        (1, 3, '2025-01-01 12:00:00');
        `
    );

    await pool.query(
      `INSERT INTO Note (CreatedBy, EquipmentID, Note, CreatedAt) VALUES
        (1, 1, 'Note for Laptop 1', '2025-02-01 12:00:00'),
        (1, 1, 'Note for Laptop 2', '2025-02-02 12:00:00'),
        (2, 2, 'Note for TV', '2025-02-03 12:00:00');
        `
    );

    await pool.query(
      `INSERT INTO Audit (CreatedBy, LocationID, AuditTime) VALUES
        (1, 1, '2025-01-01 11:00:00');
        `
    );

    await pool.query(
      `INSERT INTO AuditDetails (AuditID, EquipmentID, AuditNote, AuditStatusID) VALUES
        (1, 1, 'Found in room', 1),
        (1, 2, 'Found in room', 1),
        (1, 3, 'This needs to be archived', 2);
        `
    );

    console.log("Dummy data succesfully inserted");
  } catch (error) {
    console.error("Error: ", error);
  } finally {
    await pool.end();
  }
}

void seedDatabase();
