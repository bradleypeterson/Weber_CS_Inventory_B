import { useQuery } from "react-query";
import { fetchPendingAssetRequests, type PendingAssetRequest } from "../../api/approvalRequests";
import type { Column } from "../../elements/DynamicTable/DynamicTable";
import { DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import styles from "./AssetApproveDashboard.module.css";

type AssetApprovalRequest = {
  RequestID: number;
  TagNumber: string;
  Description: string | null;
  RequestedBy: string;
  RequestedAt: string;
};

const columns: Column<AssetApprovalRequest>[] = [
  { label: "Tag Number", dataIndex: "TagNumber", align: "left" },
  { label: "Description", dataIndex: "Description", align: "left" },
  { label: "Requested By", dataIndex: "RequestedBy", align: "left" },
  { label: "Requested At", dataIndex: "RequestedAt", align: "left" }
];

export function AssetApproveDashboard() {
  const { data: requests, isLoading, isError, error } = useQuery<PendingAssetRequest[], Error>(
    "PendingAssetRequests",
    fetchPendingAssetRequests
  );

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <h2>Approve Assets</h2>
      </div>

      {isLoading && <p>Loading pending requests...</p>}
      {isError && <p>{error.message}</p>}
      {!isLoading && !isError && requests?.length === 0 && <p>No pending asset requests.</p>}
      {!isLoading && !isError && requests && requests.length > 0 && (
        <DynamicTable columns={columns} data={requests} />
      )}
    </main>
  );
}

export default AssetApproveDashboard;