import { useId } from "react";
import { CeacIcon } from "../icons";

function FieldFrame({ id, label, help, error, children }) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className={`ev2c-field ${error ? "ev2c-field-invalid" : ""}`} htmlFor={id}>
      <span className="ev2c-field-label">{label}</span>
      {children({ describedBy })}
      {help ? <span id={helpId} className="ev2c-field-help">{help}</span> : null}
      {error ? <span id={errorId} className="ev2c-field-error">{error}</span> : null}
    </label>
  );
}

export function InputField({
  id: providedId,
  label,
  help,
  error,
  leadingIcon,
  className,
  ...inputProps
}) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldFrame id={id} label={label} help={help} error={error}>
      {({ describedBy }) => (
        <span className={`ev2c-field-control ${className || ""}`}>
          {leadingIcon ? <CeacIcon name={leadingIcon} size="control" decorative /> : null}
          <input
            id={id}
            className="ev2c-input"
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : undefined}
            {...inputProps}
          />
        </span>
      )}
    </FieldFrame>
  );
}

export function TextareaField({
  id: providedId,
  label,
  help,
  error,
  className,
  rows = 3,
  ...textareaProps
}) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldFrame id={id} label={label} help={help} error={error}>
      {({ describedBy }) => (
        <span className={`ev2c-field-control ev2c-field-control-textarea ${className || ""}`}>
          <textarea
            id={id}
            className="ev2c-textarea"
            rows={rows}
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : undefined}
            {...textareaProps}
          />
        </span>
      )}
    </FieldFrame>
  );
}

export function SelectField({
  id: providedId,
  label,
  help,
  error,
  options = [],
  className,
  ...selectProps
}) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldFrame id={id} label={label} help={help} error={error}>
      {({ describedBy }) => (
        <span className={`ev2c-field-control ev2c-field-control-select ${className || ""}`}>
          <select
            id={id}
            className="ev2c-select"
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : undefined}
            {...selectProps}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <CeacIcon name="chevronDown" size="meta" decorative />
        </span>
      )}
    </FieldFrame>
  );
}
