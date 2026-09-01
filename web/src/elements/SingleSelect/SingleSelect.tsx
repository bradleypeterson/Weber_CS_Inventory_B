import { CaretDown } from "@phosphor-icons/react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./SingleSelect.module.css";

type Option<T> = {
  value: T;
  label: string;
};

type Props<T> = {
  options: Option<T>[];
  placeholder?: string;
  value?: T;
  onChange?: (value: T) => void;
  width?: string;
  disabled?: boolean;
};

export function SingleSelect<T>(props: Props<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  function toggleOpen() {
    setOpen((prev) => {
      if (prev) return false;
      if (!props.disabled) return true;
      return false;
    });
  }

  function selectOption(value: T) {
    if (props.onChange) props.onChange(value);
    setOpen(false);
    setSearchTerm("");
    setFocusedIndex(null);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown")
      setFocusedIndex((prev) => (prev === null || prev === filteredOptions.length - 1 ? 0 : prev + 1));
    else if (event.key === "ArrowUp")
      setFocusedIndex((prev) => (prev === null || prev === 0 ? filteredOptions.length - 1 : prev - 1));
    else if (event.key === "Enter" && focusedIndex !== null) selectOption(filteredOptions[focusedIndex].value);
    else if (event.key === "Escape") setOpen(false);
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

  const selectedOption = useMemo(
    () => props.options.find((option) => option.value === props.value),
    [props.options, props.value]
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
        {selectedOption ? <span>{selectedOption.label}</span> : <p>{props.placeholder}</p>}
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
                className={`${styles.option} ${focusedIndex === i ? styles.focused : ""} ${option.value === props.value ? styles.selected : ""}`}
                onClick={() => selectOption(option.value)}
                role="option"
                aria-selected={selectedOption?.value === option.value}
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
