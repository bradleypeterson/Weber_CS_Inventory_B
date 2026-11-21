import { useQuery } from "react-query";
import { fetchUserAssetRequests, UserAssetRequest } from "../../api/approvalRequests";
import type { Column } from "../../elements/DynamicTable/DynamicTable";
import { DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import styles from "./MyAssetRequestsDashboard.module.css";

export function MyAssetRequestsDashboard() {
  const { data: requests, isLoading, isError, error } = useQuery<UserAssetRequest[], Error>(
    "MyAssetRequests",
    fetchUserAssetRequests
  );


  const columns: Column<UserAssetRequest>[] = [
    { label: "Tag Number", dataIndex: "TagNumber", align: "left" },
    { label: "Description", dataIndex: "Description", align: "left" },
    { label: "Requested At", dataIndex: "RequestedAt", align: "left" },
    { label: "Status", dataIndex: "Status", align: "left" },
    { label: "Reviewed At", dataIndex: "ReviewedAt", align: "left" },
    { label: "Review Note", dataIndex: "ReviewNote", align: "left" },
  ];


  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <h2>My Asset Requests</h2>
      </div>

      {isLoading && <p>Loading your asset requests...</p>}
      {isError && <p role="alert">{error.message}</p>}

      {!isLoading && !isError && requests?.length === 0 && (
        <p>You have not made any asset requests.</p>
      )}
      {!isLoading && !isError && requests && requests.length > 0 && (
        <DynamicTable columns={columns} data={requests} />
      )}

    </main>
  );
}

export default MyAssetRequestsDashboard;