import { CaretDown } from "@phosphor-icons/react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./MultiSelect.module.css";

type Option<T> = {
  value: T;
  label: string;
};

type Props<T> = {
  options: Option<T>[];
  placeholder?: string;
  values?: T[];
  onChange?: (value: T[]) => void;
  width?: string;
  numOfTags?: number;
  disabled?: boolean;
};

export function MultiSelect<T>(props: Props<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const valueListRef = useRef<HTMLDivElement | null>(null);
  const remainingTagsRef = useRef<HTMLSpanElement | null>(null);
  function toggleOpen() {
    setOpen((prev) => {
      if (prev) return false;
      if (!props.disabled) return true;
      return false;
    });
  }

  function onOptionClick(value: T) {
    if (value === undefined) return;
    const newValues = [...(props.values ?? [])];
    const index = newValues.findIndex((newValue) => newValue === value);
    if (index > -1) newValues.splice(index, 1);
    else newValues.push(value);

    if (props.onChange) props.onChange(newValues);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown")
      setFocusedIndex((prev) => (prev === null || prev === filteredOptions.length - 1 ? 0 : prev + 1));
    else if (event.key === "ArrowUp")
      setFocusedIndex((prev) => (prev === null || prev === 0 ? filteredOptions.length - 1 : prev - 1));
    else if (event.key === "Enter" && focusedIndex !== null) {
      const value = props.options[focusedIndex].value;
      onOptionClick(value);
    } else if (event.key === "Escape") setOpen(false);
    else setFocusedIndex(null);
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (focusedIndex !== null && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [focusedIndex]);

  const filteredOptions = useMemo(
    () =>
      searchTerm === ""
        ? props.options
        : props.options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm, props.options]
  );

  const selectedOptions = useMemo(
    () => props.options.filter((option) => props.values?.includes(option.value)),
    [props.options, props.values]
  );

  const displayedOptions = useMemo(
    () => selectedOptions.slice(0, props.numOfTags ?? 1).map((option) => option.label),
    [selectedOptions, props.numOfTags]
  );

  const remainingTags = useMemo(
    () =>
      displayedOptions.length < selectedOptions.length
        ? `+${selectedOptions.length - displayedOptions.length}`
        : undefined,
    [selectedOptions, displayedOptions]
  );

  return (
    <div className={styles.container} ref={containerRef} style={{ width: props.width }} onKeyDown={handleKeyDown}>
      <div
        className={`${styles.select} ${props.disabled ? styles.disabled : ""}`}
        onClick={toggleOpen}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select an option"
      >
        <div ref={valueListRef} className={styles.valueList}>
          <div className={styles.valueList}>
            {displayedOptions.length > 0
              ? displayedOptions.map((option, i) => <span key={i}>{option}</span>)
              : props.placeholder && <span className={styles.placeholder}>{props.placeholder}</span>}
          </div>
          {remainingTags && (
            <span ref={remainingTagsRef} className={styles.remainingTags}>
              {remainingTags}
            </span>
          )}
        </div>
        <CaretDown style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "0.1s ease-in-out" }} />
      </div>
      {open && (
        <div className={styles.dropdown}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            placeholder="Search..."
            autoFocus
          />
          <ul className={styles.optionList} role="listbox">
            {filteredOptions.map((option, i) => (
              <li
                key={i}
                className={`${styles.option} ${focusedIndex === i ? styles.focused : ""} ${selectedOptions.includes(option) ? styles.selected : ""}`}
                onClick={() => onOptionClick(option.value)}
                role="option"
                aria-selected={selectedOptions.some((selected) => selected.value === option.value)}
                ref={(el) => (optionRefs.current[i] = el)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
