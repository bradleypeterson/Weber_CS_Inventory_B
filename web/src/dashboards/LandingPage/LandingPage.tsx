import { Sidebar } from "../../components/Sidebar/Sidebar";

export function LandingPage() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          padding: "2rem"
        }}
      >
        <h1>Welcome to the School of Computing Asset Manager</h1>
      </div>
    </div>
  );
}
