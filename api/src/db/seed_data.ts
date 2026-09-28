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
        ('Other', 'OTH'),
        ('McKay Education Building', 'ED'),
        ('Interprofessional Education Building', 'IE'),
        ('Kimball Visual Arts Center', 'KA'),
        ('Lindquist Hall', 'LH'),
        ('Stewart Library', 'LI'),
        ('Lind Lecture', 'LL'),
        ('Portable M5', 'M5'),
        ('Portable M6', 'M6'),
        ('Portable M7', 'M7'),
        ('Portable M13', 'M13'),
        ('Portable M14', 'M14'),
        ('Portable M16', 'M16'),
        ('Portable M17', 'M17'),
        ('Marriott Allied Health', 'MH'),
        ('Outdoor Adventure & Welcome Center', 'OA'),
        ('Swenson Building', 'SW'),
        ('Tracy Hall Science Center', 'TY'),
        ('Wattis Business', 'WB');
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
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '103', 'D2103'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '104', 'D2104'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '105', 'D2105'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '106', 'D2106'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '112', 'D2112'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '113', 'D2113'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '114', 'D2114'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '117', 'D2117'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '223', 'D2223'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '225', 'D2225'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '226', 'D2226'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '232', 'D2232'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '312', 'D2312'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '314', 'D2314'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '318', 'D2318'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '320', 'D2320'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '321', 'D2321'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '322', 'D2322'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '324', 'D2324'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D2' LIMIT 1), '325', 'D2325'),
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
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '202', 'DSC202'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '203', 'DSC203'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '204', 'DSC204'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '205', 'DSC205'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '206', 'DSC206'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '233', 'DSC233'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '235', 'DSC235'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '236', 'DSC236'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '302', 'DSC302'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '304', 'DSC304'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '306', 'DSC306'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '307', 'DSC307'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '336', 'DSC336'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '337', 'DSC337'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '339', 'DSC339'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '340', 'DSC340'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '341', 'DSC341'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'DSC' LIMIT 1), '342', 'DSC342'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CAE' LIMIT 1), '106', 'CAE106'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CAE' LIMIT 1), '141', 'CAE141'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CAE' LIMIT 1), '142', 'CAE142'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CAE' LIMIT 1), '143', 'CAE143'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CAE' LIMIT 1), '145', 'CAE145'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CCE' LIMIT 1), '127', 'CCE127'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CCE' LIMIT 1), '206', 'CCE206'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CCE' LIMIT 1), '207', 'CCE207'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'CCE' LIMIT 1), '209', 'CCE209'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D13' LIMIT 1), '105', 'D13105'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D13' LIMIT 1), '123', 'D13123'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D13' LIMIT 1), '124', 'D13124'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D13' LIMIT 1), '207', 'D13207'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D13' LIMIT 1), '208', 'D13208'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D13' LIMIT 1), '217', 'D13217'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'D13' LIMIT 1), '218', 'D13218');
        `
    );

    // Ogden rooms verified from the supplied official classroom listing.
    // Keep these after existing locations to preserve legacy numeric references.
    await pool.query(
      `INSERT INTO Location(BuildingID, RoomNumber, Barcode) VALUES
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '301', 'ED301'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '304', 'ED304'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '321', 'ED321'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '322', 'ED322'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '326', 'ED326'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '327', 'ED327'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '328', 'ED328'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '330', 'ED330'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '331', 'ED331'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '010A', 'ED010A'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ED' LIMIT 1), '010B', 'ED010B'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '104', 'EH104'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '105', 'EH105'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '106', 'EH106'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '115', 'EH115'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '116', 'EH116'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '117', 'EH117'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '118', 'EH118'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '203', 'EH203'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '204', 'EH204'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '205', 'EH205'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '206', 'EH206'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '215', 'EH215'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '216', 'EH216'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '217', 'EH217'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '218', 'EH218'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '219', 'EH219'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '220', 'EH220'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '304', 'EH304'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '305', 'EH305'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '306', 'EH306'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '315', 'EH315'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '316', 'EH316'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '317', 'EH317'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '323', 'EH323'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '403', 'EH403'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '406', 'EH406'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '407', 'EH407'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'EH' LIMIT 1), '408', 'EH408'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '102', 'ET102'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '104', 'ET104'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '204', 'ET204'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '216', 'ET216'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '224', 'ET224'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '228', 'ET228'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '238', 'ET238'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'ET' LIMIT 1), '240', 'ET240'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'IE' LIMIT 1), '107A', 'IE107A'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'IE' LIMIT 1), '107B', 'IE107B'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'KA' LIMIT 1), '143', 'KA143'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '102', 'LH102'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '104', 'LH104'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '106', 'LH106'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '112', 'LH112'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '114', 'LH114'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '116', 'LH116'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '124', 'LH124'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '174', 'LH174'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '201', 'LH201'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '202', 'LH202'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '204', 'LH204'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '205', 'LH205'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '206', 'LH206'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '207', 'LH207'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '211', 'LH211'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '212', 'LH212'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '214', 'LH214'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '216', 'LH216'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '222', 'LH222'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '280', 'LH280'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '301', 'LH301'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '302', 'LH302'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '304', 'LH304'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '305', 'LH305'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '342', 'LH342'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '395', 'LH395'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '022', 'LH022'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '050', 'LH050'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LH' LIMIT 1), '054', 'LH054'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LI' LIMIT 1), '325', 'LI325'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '101', 'LL101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '102', 'LL102'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '121', 'LL121'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '122', 'LL122'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '123', 'LL123'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '124', 'LL124'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '125', 'LL125'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '130', 'LL130'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '221', 'LL221'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '222', 'LL222'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '223', 'LL223'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '224', 'LL224'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '228', 'LL228'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '229', 'LL229'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'LL' LIMIT 1), '231', 'LL231'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M5' LIMIT 1), '100', 'M5100'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M5' LIMIT 1), '101', 'M5101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M6' LIMIT 1), '100', 'M6100'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M6' LIMIT 1), '101', 'M6101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M7' LIMIT 1), '100', 'M7100'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M7' LIMIT 1), '101', 'M7101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M13' LIMIT 1), '100', 'M13100'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M13' LIMIT 1), '101', 'M13101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M14' LIMIT 1), '101', 'M14101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M16' LIMIT 1), '100', 'M16100'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M16' LIMIT 1), '101', 'M16101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M17' LIMIT 1), '100', 'M17100'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'M17' LIMIT 1), '101', 'M17101'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '117', 'MH117'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '222', 'MH222'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '304', 'MH304'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '327', 'MH327'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '341', 'MH341'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '351', 'MH351'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '355', 'MH355'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '417', 'MH417'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'MH' LIMIT 1), '480', 'MH480'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '122', 'NB122'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '127', 'NB127'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '204', 'NB204'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '211', 'NB211'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '232', 'NB232'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '236', 'NB236'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '304', 'NB304'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '305', 'NB305'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '311', 'NB311'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '312', 'NB312'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '316', 'NB316'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '318', 'NB318'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '322', 'NB322'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '324', 'NB324'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '325', 'NB325'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '326', 'NB326'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '328', 'NB328'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '001', 'NB001'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'NB' LIMIT 1), '004', 'NB004'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'OA' LIMIT 1), '203', 'OA203'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'SW' LIMIT 1), '134', 'SW134'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'SW' LIMIT 1), '225', 'SW225'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'SW' LIMIT 1), '232', 'SW232'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'SW' LIMIT 1), '238', 'SW238'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'SW' LIMIT 1), '314', 'SW314'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'SW' LIMIT 1), '410', 'SW410'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '102', 'TY102'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '209', 'TY209'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '229', 'TY229'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '234', 'TY234'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '240', 'TY240'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '340', 'TY340'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '342', 'TY342'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '363', 'TY363'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '364', 'TY364'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '365', 'TY365'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '426', 'TY426'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '448', 'TY448'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '449', 'TY449'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '466', 'TY466'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '101P', 'TY101P'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'TY' LIMIT 1), '101R', 'TY101R'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '103', 'WB103'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '104', 'WB104'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '105', 'WB105'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '106', 'WB106'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '110', 'WB110'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '112', 'WB112'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '113', 'WB113'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '116', 'WB116'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '117', 'WB117'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '119', 'WB119'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '120', 'WB120'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '121', 'WB121'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '122', 'WB122'),
        ((SELECT BuildingID FROM Building WHERE Abbreviation = 'WB' LIMIT 1), '203', 'WB203');`
    );

    await pool.query(
      `INSERT INTO Person(Wnumber, FirstName, LastName, LocationID) VALUES
        ('W01111111', 'Matt', 'Western', 1),
        ('W01111112', 'Maria', 'Bennett', 2),
        ('W01111113', 'Ben', 'Cash', 3),
        ('W01111114', 'Josh', 'Morgan', 4),
        ('W01111115', 'Patrick', 'Beck', (SELECT LocationID FROM Location WHERE Barcode = 'CAE106' LIMIT 1)),
        ('W01111116', 'Asset', 'Tester', (SELECT LocationID FROM Location WHERE Barcode = 'CAE106' LIMIT 1)),
        ('W01111117', 'Contact List', 'Tester', (SELECT LocationID FROM Location WHERE Barcode = 'CAE106' LIMIT 1)),
        ('W01111118', 'User Admin', 'Tester', (SELECT LocationID FROM Location WHERE Barcode = 'CAE106' LIMIT 1)),
        ('W01111119', 'No Permission', 'Tester', (SELECT LocationID FROM Location WHERE Barcode = 'CAE106' LIMIT 1));
        `
    );

    // Fictional baseline contacts, not login accounts.
    // CCE/D13 use verified rooms as fictional test assignments, not real staff offices.
    // DA remains unset until its building and physical room are confirmed.
    await pool.query(
      `INSERT INTO Person(Wnumber, FirstName, LastName, LocationID) VALUES
        ('W01111120', 'D3', 'Test Contact', (SELECT LocationID FROM Location WHERE Barcode = 'D3201' LIMIT 1)),
        ('W01111121', 'DA', 'Test Contact', NULL),
        ('W01111122', 'DSC', 'Test Contact', (SELECT LocationID FROM Location WHERE Barcode = 'DSC104' LIMIT 1)),
        ('W01111123', 'CCE', 'Test Contact', (SELECT LocationID FROM Location WHERE Barcode = 'CCE127' LIMIT 1)),
        ('W01111124', 'D13', 'Test Contact', (SELECT LocationID FROM Location WHERE Barcode = 'D13105' LIMIT 1));`
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
      // Use the same credentials as the existing seed users (password: "a").
      `INSERT INTO User(PersonID, HashedPassword, Salt)
       SELECT PersonID,
         '6386b1dfb33a3a4439e15e45363d4ab3c51a8fa758086d9a51670834a78f8bbf',
         '2cef97f7a9744f60ceb9f93839e09929'
       FROM Person
       WHERE WNumber IN ('W01111116', 'W01111117', 'W01111118', 'W01111119');`
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
      `INSERT INTO UserPermission(UserID, PermissionID)
       SELECT u.UserID, permission.PermissionID
       FROM User u
       JOIN Person p ON p.PersonID = u.PersonID
       CROSS JOIN Permission permission
       WHERE (p.WNumber = 'W01111116' AND permission.PermissionID IN (1, 2, 3))
          OR (p.WNumber = 'W01111117' AND permission.PermissionID IN (4, 5))
          OR (p.WNumber = 'W01111118' AND permission.PermissionID IN (6, 7));`
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
      `INSERT INTO PersonDepartment(PersonID, DepartmentID)
       SELECT p.PersonID, d.DepartmentID
       FROM Person p
       CROSS JOIN Department d
       WHERE p.WNumber IN ('W01111116', 'W01111117', 'W01111118', 'W01111119')
         AND d.Abbreviation = 'SOC';`
    );

    await pool.query(
      `INSERT INTO PersonDepartment(PersonID, DepartmentID)
       SELECT p.PersonID, d.DepartmentID
       FROM Person p
       CROSS JOIN Department d
       WHERE p.WNumber IN ('W01111120', 'W01111121', 'W01111122', 'W01111123', 'W01111124')
         AND d.Abbreviation = 'SOC';`
    );

    await pool.query(
      `INSERT INTO Equipment(TagNumber, SerialNumber, Description, ContactPersonID, LocationID, DepartmentID, AssetClassID, FiscalYearID, ConditionID, DeviceTypeID, Manufacturer, PartNumber, Rapid7, CrowdStrike, ArchiveStatus, PONumber, SecondaryNumber, AccountingDate, AccountCost) VALUES
        ('1', '1', 'Laptop', 1, 1, 1, 3, 1, 1, 2, 'Dell', '1', TRUE, TRUE, FALSE, '1', '1', '2025-01-01', 1000),
        ('2', '2', 'TV', 2, 2, 2, 1, 1, 2, 8, 'Samsung', '2', FALSE, FALSE, FALSE, '2', '2', '2025-01-01', 800),
        ('3', '3', 'Projector', 1, 1, 1, 2, 1, 5, 7, 'Samsung', '3', FALSE, FALSE, TRUE, '3', '3', '2024-01-01', 200);
        `
    );

    // Fictional assets: one per empty active room, cycling PC/LT/PJ/PR by room ID.
    // Existing assets are retained. SOC/Good are test defaults.
    // Keep this after the original assets so their IDs remain valid for notes and audits.
    await pool.query(
      `INSERT INTO Equipment (
        TagNumber, SerialNumber, Description, LocationID, DepartmentID,
        DeviceTypeID, ConditionID, AssetClassID, Rapid7, CrowdStrike, ArchiveStatus
      )
      SELECT
        CONCAT('TEST-LOC-', l.LocationID),
        CONCAT('SN-TEST-LOC-', l.LocationID),
        CASE MOD(l.LocationID - 1, 4)
          WHEN 0 THEN 'Test PC' WHEN 1 THEN 'Test Laptop'
          WHEN 2 THEN 'Test Projector' ELSE 'Test Printer'
        END,
        l.LocationID,
        (SELECT DepartmentID FROM Department WHERE Abbreviation = 'SOC' AND Deleted = FALSE),
        (SELECT DeviceTypeID FROM DeviceType
         WHERE Abbreviation = CASE MOD(l.LocationID - 1, 4)
           WHEN 0 THEN 'PC' WHEN 1 THEN 'LT' WHEN 2 THEN 'PJ' ELSE 'PR' END
           AND Deleted = FALSE),
        (SELECT ConditionID FROM \`Condition\` WHERE ConditionAbbreviation = 'GD' AND Deleted = FALSE),
        (SELECT AssetClassID FROM AssetClass
         WHERE Abbreviation = CASE WHEN MOD(l.LocationID - 1, 4) = 2 THEN 'CE' ELSE 'CP' END
           AND Deleted = FALSE),
        FALSE, FALSE, FALSE
      FROM Location l
      JOIN Building b ON b.BuildingID = l.BuildingID AND b.Deleted = FALSE
      WHERE l.Deleted = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM Equipment e
          WHERE e.LocationID = l.LocationID AND e.Deleted = FALSE
        );`
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
