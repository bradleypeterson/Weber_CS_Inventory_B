import { ArrowRight, Barcode } from "@phosphor-icons/react";
import { PermissionId, hasPermission } from "../../../../@types/permissions";
import { useState } from "react";
import { useMutation } from "react-query";
import { IconButton } from "../../elements/IconButton/IconButton";
import { IconInput } from "../../elements/IconInput/IconInput";
import { useAuth } from "../../hooks/useAuth";
import { useLinkTo } from "../../navigation/useLinkTo";
import styles from "./AuditInitiateDashboard.module.css";

interface AuditResponse {
  status: "success";
  data: {
    roomNumber: string;
    locationId: number;
    equipmentCount: number;
    auditIds: number[];
    isEmptyRoom: boolean;
  };
}

export function AuditInitiateDashboard() {
  const { permissions } = useAuth();
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const linkTo = useLinkTo();  

  const initiateAudit = useMutation<AuditResponse, Error, string>({
    mutationFn: async (roomBarcode: string) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated - please log in');
      }

      // Clear all audit-related data from localStorage before starting new audit
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('audit_') || key === 'current_room_id') {
          localStorage.removeItem(key);
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/audits/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomBarcode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Authentication failed - please log in again');
        }
        throw new Error(errorData.error?.message || 'Failed to initiate audit');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Navigate to new audit page with room info
      setError("");
      linkTo(
        "New Audit", 
        ["Audits", "Initiate Audit"], 
        `room_id=${data.data.locationId}&room_number=${data.data.roomNumber}`
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
    initiateAudit.mutate(barcode);
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
            disabled={barcode === "" || initiateAudit.isLoading}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </main>
  );
}
