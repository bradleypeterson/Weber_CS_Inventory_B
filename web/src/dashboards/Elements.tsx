// import { MagnifyingGlass } from "@phosphor-icons/react";
// import { useState } from "react";
// import { Checkbox } from "../elements/Checkbox/Checkbox";
// import { IconInput } from "../elements/IconInput/IconInput";
// import { LabelInput } from "../elements/LabelInput/LabelInput";
// import { MultiSelect } from "../elements/MultiSelect/MultiSelect";
// import { SingleSelect } from "../elements/SingleSelect/SingleSelect";
// import { Table } from "../elements/Table/Tables";
// import { TextArea } from "../elements/TextArea/TextArea";

// export function Elements() {
//   const [selectedValue, setSelectedValue] = useState(3);
//   const [selectedValues, setSelectedValues] = useState([3]);

//   const [data, setData] = useState([
//     { id: 1, building: "Browning Center", abbreviation: "BC", status: "active" },
//     { id: 2, building: "Elizabeth Hall", abbreviation: "EH", status: "inactive" },
//     { id: 3, building: "Lind Lecture Hall", abbreviation: "LL", status: "inactive" }
//   ]);

//   const columns = [
//     { key: "building", label: "Building", type: "text" },
//     { key: "abbreviation", label: "Abbreviation", type: "text", width: "10px" },
//     {
//       key: "status",
//       label: "Status",
//       type: "dropdown",
//       options: [
//         { label: "Active", value: "active" },
//         { label: "Inactive", value: "inactive" }
//       ]
//     },
//     { key: "edit", label: "Edit", type: "icon", icon: "edit", action: () => alert("edit building") },
//     { key: "add", label: "Add Room", type: "icon", icon: "plus", action: () => alert("edit rooms") },
//     { key: "delete", label: "Delete", type: "icon", icon: "trash", action: () => alert("delete building") }
//   ];

//   return (
//     <div style={{ margin: "1rem" }}>
//       <SingleSelect
//         options={selectOptions}
//         placeholder="department"
//         width={"220px"}
//         onChange={(val) => setSelectedValue(Number(val))}
//         value={selectedValue}
//       />
//       <br></br>
//       <MultiSelect
//         options={selectOptions}
//         placeholder="department"
//         width={"330px"}
//         onChange={(vals) => setSelectedValues(vals)}
//         values={selectedValues}
//         numOfTags={2}
//       />
//       <br></br>
//       <IconInput placeholder={"Search"} width={"220px"} icon={<MagnifyingGlass />} />
//       <br></br>
//       <LabelInput placeholder={"Enter Name"} width={"220px"} label={"Name"} />
//       <br></br>
//       <Table columns={columns} data={data} selectable={true} onDataChange={setData} />
//       <br />
//       <Checkbox label="Checkbox" />
//       <br />
//       <TextArea placeholder="placeholder" width="220px" />
//       <br />
//     </div>
//   );
// }

// const selectOptions = [
//   { label: "Option 1", value: 1 },
//   { label: "Option 2", value: 2 },
//   { label: "Option 3", value: 3 },
//   { label: "Option 4", value: 4 },
//   { label: "Option 5", value: 5 },
//   { label: "Option 6", value: 6 },
//   { label: "Option 7", value: 7 },
//   { label: "Option 8", value: 8 },
//   { label: "Option 9", value: 9 },
//   { label: "Option 10", value: 10 },
//   { label: "Long option name that should exceed the limit", value: 11 }
// ];
