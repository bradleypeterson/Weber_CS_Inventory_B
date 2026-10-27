import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  fetchPendingAssetRequests,
  reviewAssetRequest,
  type PendingAssetRequest,
  type ReviewDecision
} from "../../api/approvalRequests";
import { Button } from "../../elements/Button/Button";
import type { Column } from "../../elements/DynamicTable/DynamicTable";
import { DynamicTable } from "../../elements/DynamicTable/DynamicTable";
import { Modal } from "../../elements/Modal/Modal";
import styles from "./AssetApproveDashboard.module.css";

type ReviewVariables = {
  requestId: number;
  decision: ReviewDecision;
  note: string;
};

export function AssetApproveDashboard() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<PendingAssetRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data: requests, isLoading, isError, error } = useQuery<PendingAssetRequest[], Error>(
    "PendingAssetRequests",
    fetchPendingAssetRequests
  );

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, decision, note }: ReviewVariables) =>
      reviewAssetRequest(requestId, decision, note),
    onSuccess: () => {
      setSelectedRequest(null);
      setReviewNote("");
      void queryClient.invalidateQueries("PendingAssetRequests");
    }
  });

  const closeModal = () => {
    if (reviewMutation.isLoading) return;
    setSelectedRequest(null);
    setReviewNote("");
  };

  const submitReview = (decision: ReviewDecision) => {
    if (!selectedRequest || reviewMutation.isLoading) return;

    reviewMutation.mutate({
      requestId: selectedRequest.RequestID,
      decision,
      note: reviewNote.trim()
    });
  };

  const columns: Column<PendingAssetRequest>[] = [
    { label: "Tag Number", dataIndex: "TagNumber", align: "left" },
    { label: "Description", dataIndex: "Description", align: "left" },
    { label: "Requested By", dataIndex: "RequestedBy", align: "left" },
    { label: "Requested At", dataIndex: "RequestedAt", align: "left" },
    {
      label: "Review",
      render: (request) => (
        <Button
          type="button"
          variant="primary"
          size="small"
          onClick={() => {
            setReviewNote("");
            setSelectedRequest(request);
            reviewMutation.reset();
          }}
        >
          Review
        </Button>
      )
    }
  ];

  return (
    <main className={styles.layout}>
      <div className={styles.row}>
        <h2>Approve Assets</h2>
      </div>

      {isLoading && <p>Loading pending requests...</p>}
      {isError && <p role="alert">{error.message}</p>}
      {reviewMutation.isError && (
        <p role="alert">
          {reviewMutation.error instanceof Error
            ? reviewMutation.error.message
            : "Could not review asset request."}
        </p>
      )}
      {!isLoading && !isError && requests?.length === 0 && (
        <p>No pending asset requests.</p>
      )}
      {!isLoading && !isError && requests && requests.length > 0 && (
        <DynamicTable columns={columns} data={requests} />
      )}

      <Modal
        isOpen={selectedRequest !== null}
        onClose={closeModal}
        title={`Review Asset Request${selectedRequest ? ` #${selectedRequest.RequestID}` : ""}`}
      >
        {selectedRequest && (
          <div className={styles.modalContent}>
            <p><strong>Requested by:</strong> {selectedRequest.RequestedBy}</p>
            <p><strong>Requested at:</strong> {selectedRequest.RequestedAt}</p>

            <h3>Asset details</h3>
            <dl className={styles.detailsList}>
              {Object.entries(selectedRequest.AssetDetails).map(([key, value]) => (
                <div key={key} className={styles.detailRow}>
                  <dt>{key.replace(/([a-z])([A-Z])/g, "$1 $2")}</dt>
                  <dd>
                    {value === null ? "(empty)" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                  </dd>
                </div>
              ))}
            </dl>

            <label className={styles.noteLabel} htmlFor="approval-review-note">
              Review note (optional)
            </label>
            <textarea
              id="approval-review-note"
              rows={3}
              maxLength={1000}
              value={reviewNote}
              disabled={reviewMutation.isLoading}
              onChange={(event) => setReviewNote(event.target.value)}
            />

            {reviewMutation.isError && (
              <p role="alert">
                {reviewMutation.error instanceof Error
                  ? reviewMutation.error.message
                  : "Could not review asset request."}
              </p>
            )}

            <div className={styles.modalButtons}>
              <Button
                type="button"
                variant="primary"
                disabled={reviewMutation.isLoading}
                onClick={() => submitReview("approved")}
              >
                {reviewMutation.isLoading && reviewMutation.variables?.decision === "approved"
                  ? "Approving..."
                  : "Approve"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={reviewMutation.isLoading}
                onClick={() => submitReview("denied")}
              >
                {reviewMutation.isLoading && reviewMutation.variables?.decision === "denied"
                  ? "Denying..."
                  : "Deny"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={reviewMutation.isLoading}
                onClick={closeModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}

export default AssetApproveDashboard;