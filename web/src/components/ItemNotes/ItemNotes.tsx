import { Pencil } from "@phosphor-icons/react";
import { useState } from "react";
import { IconButton } from "../../elements/IconButton/IconButton";
import { ItemNoteModal } from "./ItemNoteModal";
import styles from "./ItemNotes.module.css";

type Equipment = {
  TagNumber: string;
  Description: string;
};

type ItemNote = {
  tagNumber: string;
  note: string;
};

type Props = {
  itemNotes: ItemNote[];
  equipmentItems: Equipment[];
  onAdd?: (tagNumber: string, note: string) => void;
  onDelete?: (tagNumber: string) => void;
};

export function ItemNotes({ itemNotes, equipmentItems, onAdd, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ItemNote | null>(null);

  function getItemDescription(tagNumber: string) {
    const item = equipmentItems.find((i) => i.TagNumber === tagNumber);
    return item ? `${item.TagNumber} - ${item.Description}` : tagNumber;
  }

  function handleEditNote(note: ItemNote) {
    setEditingNote(note);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingNote(null);
  }

  function handleSaveNote(tagNumber: string, note: string) {
    if (!onAdd) return;
    onAdd(tagNumber, note);
    handleCloseModal();
  }

  function handleDeleteNote(tagNumber: string) {
    if (!onDelete) return;
    onDelete(tagNumber);
    handleCloseModal();
  }

  return (
    <>
      <div className={styles.notesContainer}>
        <div className={styles.row}>
          <h3>Item Notes</h3>
        </div>
        <div>
          {itemNotes.length === 0 && <span style={{ color: "var(--white-dim)" }}>Nothing to see here</span>}
          {itemNotes.map((note, index) => {
            const itemDescription = getItemDescription(note.tagNumber);
            
            return (
              <article key={`note-${index}`} className={styles.note}>
                <div className={styles.noteHeader}>
                  {itemDescription}
                  <IconButton 
                    icon={<Pencil size={16} />} 
                    variant="secondary" 
                    onClick={() => handleEditNote(note)} 
                  />
                </div>
                <div className={styles.noteBody}>{note.note}</div>
              </article>
            );
          })}
        </div>
      </div>
      <ItemNoteModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveNote}
        tagNumber={editingNote?.tagNumber || ""}
        itemLabel={editingNote ? getItemDescription(editingNote.tagNumber) : ""}
        initialNote={editingNote?.note || ""}
        mode="edit"
        onDelete={handleDeleteNote}
      />
    </>
  );
} 
