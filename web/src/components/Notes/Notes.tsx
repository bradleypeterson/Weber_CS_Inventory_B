import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "../../elements/Button/Button";
import { IconButton } from "../../elements/IconButton/IconButton";
import { Modal } from "../../elements/Modal/Modal";
import { TextArea } from "../../elements/TextArea/TextArea";
import styles from "./Notes.module.css";

type Props = {
  notes: string[];
  onAdd?: (note: string) => void;
};
export function Notes({ notes, onAdd }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  function handleAdd() {
    if (onAdd) onAdd(newNoteText);
    setModalOpen(false);
  }

  return (
    <>
      <div className={styles.notesContainer}>
        <div className={styles.row}>
          <h3>Notes</h3>
          <IconButton icon={<Plus />} variant="secondary" onClick={() => setModalOpen(true)} />
        </div>
        <div>
          {notes.length === 0 && <span style={{ color: "var(--white-dim)" }}>Nothing to see here</span>}
          {notes.map((note, index) => (
            <article key={`note-${index}`} className={styles.note}>
              {note}
            </article>
          ))}
        </div>
      </div>
      <Modal onClose={() => setModalOpen(false)} isOpen={modalOpen}>
        <div className={styles.noteModalContent}>
          <h3>New Note</h3>
          <TextArea value={newNoteText} onChange={(value) => setNewNoteText(value)} />
          <div className={styles.row}>
            <Button variant="secondary" size="small" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="small" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
