import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Employee } from "@/features/employees/types";
import styles from "./GuessInput.module.scss";

interface GuessInputProps {
  value: string;
  onChange: (value: string) => void;
  onGuess: (employeeId: string) => void;
  employees: Employee[];
  guessedEmployeeIds?: string[];
  disabled?: boolean;
}

export const GuessInput = ({
  value,
  onChange,
  onGuess,
  employees,
  guessedEmployeeIds = [],
  disabled = false,
}: GuessInputProps) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<Employee[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTerm = value.toLowerCase().trim();
    const filtered = employees.filter((emp) => {
      // Filter out already guessed employees
      if (guessedEmployeeIds.includes(emp.id)) {
        return false;
      }
      const nameMatch = emp.name.toLowerCase().includes(searchTerm);
      const firstNameMatch = emp.firstName.toLowerCase().includes(searchTerm);
      const surnameMatch = emp.surname.toLowerCase().includes(searchTerm);
      return nameMatch || firstNameMatch || surnameMatch;
    });

    setSuggestions(filtered.slice(0, 5));
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [value, employees, guessedEmployeeIds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectEmployee(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelectEmployee(suggestions[0]);
      } else if (value.trim()) {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    if (!employee) {
      return;
    }
    onChange(employee.name);
    onGuess(employee.id);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const exactMatch = employees.find(
      (emp) => emp.name.toLowerCase() === value.toLowerCase().trim() && !guessedEmployeeIds.includes(emp.id)
    );

    if (exactMatch) {
      onGuess(exactMatch.id);
      onChange("");
    }
  };

  const handleSuggestionClick = (e: React.MouseEvent<HTMLLIElement>, employee: Employee) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectEmployee(employee);
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, employee: Employee) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelectEmployee(employee);
    }
  };

  return (
    <div className={styles.container}>
      <label htmlFor="guess-input" className={styles.label}>
        {t("game.enterEmployeeName")}
      </label>
      <div className={styles.inputWrapper}>
        <input
          id="guess-input"
          ref={inputRef}
          autoComplete="off"
          name="guess-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={(e) => {
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (relatedTarget && relatedTarget.closest(`.${styles.suggestions}`)) {
              return;
            }
            setTimeout(() => {
              setShowSuggestions(false);
            }, 200);
          }}
          disabled={disabled}
          className={styles.input}
          placeholder={t("game.typeEmployeeName")}
          aria-label={t("game.enterEmployeeName")}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="suggestions-list"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul id="suggestions-list" ref={suggestionsRef} className={styles.suggestions} role="listbox">
            {suggestions.map((employee, index) => {
              const displayName = `${employee.firstName} ${employee.surname}`;

              return (
                <li
                  key={employee.id}
                  className={`${styles.suggestion} ${index === selectedIndex ? styles.selected : ""}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={(e) => handleSuggestionClick(e, employee)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, employee)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  tabIndex={0}
                >
                  {displayName}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
