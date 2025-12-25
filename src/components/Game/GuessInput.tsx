import { useState, useRef, useEffect } from 'react';
import type { Employee } from '@/features/employees';
import styles from './GuessInput.module.scss';

interface GuessInputProps {
  value: string;
  onChange: (value: string) => void;
  onGuess: (employeeName: string) => void;
  employees: Employee[];
  disabled?: boolean;
}

const GuessInput = ({
  value,
  onChange,
  onGuess,
  employees,
  disabled = false,
}: GuessInputProps) => {
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

    const filtered = employees.filter((emp) =>
      emp.name.toLowerCase().includes(value.toLowerCase().trim())
    );

    setSuggestions(filtered.slice(0, 5));
    // Always show suggestions if there are matches (user can still press Enter to select first)
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [value, employees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectEmployee(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        // If there are suggestions, select the first one
        handleSelectEmployee(suggestions[0]);
      } else if (value.trim()) {
        handleSubmit();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    if (!employee) {
      return;
    }
    onChange(employee.name);
    onGuess(employee.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const exactMatch = employees.find(
      (emp) => emp.name.toLowerCase() === value.toLowerCase().trim()
    );

    if (exactMatch) {
      onGuess(exactMatch.name);
      onChange('');
    } else {
      // No exact match found - show suggestions if they exist
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      }
    }
  };

  const handleSuggestionClick = (employee: Employee) => {
    handleSelectEmployee(employee);
  };

  const handleSuggestionKeyDown = (
    e: React.KeyboardEvent<HTMLLIElement>,
    employee: Employee
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectEmployee(employee);
    }
  };

  return (
    <div className={styles.container}>
      <label htmlFor="guess-input" className={styles.label}>
        Enter employee name:
      </label>
      <div className={styles.inputWrapper}>
        <input
          id="guess-input"
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay to allow click events on suggestions
            setTimeout(() => {
              setShowSuggestions(false);
            }, 200);
          }}
          disabled={disabled}
          className={styles.input}
          placeholder="Type employee name..."
          aria-label="Guess employee name"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="suggestions-list"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul
            id="suggestions-list"
            ref={suggestionsRef}
            className={styles.suggestions}
            role="listbox"
          >
            {suggestions.map((employee, index) => (
              <li
                key={employee.id}
                className={`${styles.suggestion} ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => handleSuggestionClick(employee)}
                onKeyDown={(e) => handleSuggestionKeyDown(e, employee)}
                onMouseDown={(e) => {
                  // Prevent blur when clicking suggestion
                  e.preventDefault();
                }}
                tabIndex={0}
              >
                {employee.name}
              </li>
            ))}
          </ul>
        )}
        {value.trim().length > 0 && suggestions.length === 0 && (
          <div className={styles.noMatch} role="status" aria-live="polite">
            No employees found matching "{value}"
          </div>
        )}
      </div>
    </div>
  );
};

export default GuessInput;

