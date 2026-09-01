import { useEffect, useState } from "react";
import { Button } from "../../elements/Button/Button";
import { Modal } from "../../elements/Modal/Modal";
import { TextArea } from "../../elements/TextArea/TextArea";
import styles from "./ItemNotes.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tagNumber: string, note: string) => void;
  onDelete?: (tagNumber: string) => void;
  tagNumber: string;
  itemLabel?: string;
  initialNote?: string;
  mode: "add" | "edit";
};

export function ItemNoteModal({ isOpen, onClose, onSave, onDelete, tagNumber, itemLabel, initialNote = "", mode }: Props) {
  const [noteText, setNoteText] = useState(initialNote);

  useEffect(() => {
    if (!isOpen) return;
    setNoteText(initialNote);
  }, [initialNote, isOpen]);

  const handleSave = () => {
    const trimmed = noteText.trim();
    if (!tagNumber || !trimmed) return;
    onSave(tagNumber, trimmed);
  };

  const handleDelete = () => {
    if (!onDelete || !tagNumber) return;
    onDelete(tagNumber);
  };

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <div className={styles.noteModalContent}>
        <h3>{mode === "edit" ? "Edit Item Note" : "New Item Note"}</h3>
        <div>
          <label>Item</label>
          <div>{itemLabel || tagNumber}</div>
        </div>
        <TextArea label="Note" value={noteText} onChange={(value) => setNoteText(value)} />
        <div className={styles.row}>
          {mode === "edit" && onDelete && (
            <Button variant="secondary" size="small" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="secondary" size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="small" onClick={handleSave} disabled={!tagNumber || !noteText.trim()}>
            {mode === "edit" ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
