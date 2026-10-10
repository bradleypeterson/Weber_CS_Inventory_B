import { ArrowRight, Barcode } from "@phosphor-icons/react";
import { useState } from "react";
import { useMutation } from "react-query";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { initiateAudit } from "../../api/audit";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./AuditInitiateDashboard.module.css";


export function AuditInitiateDashboard() {
  const { permissions } = useAuth();
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const linkTo = useLinkTo();  

  const initiateAuditMutation = useMutation({
    mutationFn: async (roomBarcode: string) => {
      // Clear all audit-related data from localStorage before starting new audit
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('audit_') || key === 'current_room_id') {
          localStorage.removeItem(key);
        }
      });

      return initiateAudit(roomBarcode);
    },
    onSuccess: (data) => {
      // Navigate to new audit page with room info
      setError("");
      linkTo(
        "New Audit", 
        ["Audits", "Initiate Audit"], 
        `room_id=${data.locationId}&room_number=${data.roomNumber}`
      );
    },
    onError: (error) => {
      console.error('Failed to initiate audit:', error);
      setBarcode("");
      setError("Room not found");
    }
  });

  if (!hasPermission(permissions, PermissionId.ADD_EDIT_ASSETS)) {
    return (
      <main className={styles.layout}>
        <div className={styles.row}>
          <div style={{ color: "red" }}>You do not have permission to initiate audits.</div>
        </div>
      </main>
    );
  }

  const handleSubmit = () => {
    if (!barcode) return;
    initiateAuditMutation.mutate(barcode);
  };

  return (
    <main className={styles.layout}>
      <h1>Room Audit</h1>     
      <div className={styles.scanSection}>
        <div className={styles.errorMessage}>
          {error}
        </div>
        <div className={styles.inputRow}>
          <IconInput
            placeholder="Scan Barcode to Begin Audit"
            icon={<Barcode />}
            width="350px"
            value={barcode}
            onChange={(value) => setBarcode(value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            autoFocus
          />
          <IconButton
            icon={<ArrowRight />}
            variant="primary"
            disabled={barcode === "" || initiateAuditMutation.isLoading}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </main>
  );
}

export default AuditInitiateDashboard;
