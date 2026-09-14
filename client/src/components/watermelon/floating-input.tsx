import { cn } from "@/lib/utils";
import { useState } from "react";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Text field whose label rides up out of the way once the field is focused or
 * filled.
 *
 * Adapted from the Watermelon registry in two ways, both needed to make it
 * work as a controlled React input:
 *
 *  1. The original spread {...props} *after* its own onChange/onBlur, so a
 *     caller passing onChange -- which every controlled field does -- replaced
 *     the handler tracking whether the field has content, and the label then
 *     dropped back over the user's text. Handlers are now composed instead.
 *  2. "Has a value" is read from the controlled `value` when one is supplied,
 *     rather than from internal state that only updates on change events. That
 *     keeps the label correct when the parent sets or resets the value itself
 *     (this form clears the password field after a submit).
 */
export function FloatingInput({
  label,
  className,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [uncontrolledHasValue, setUncontrolledHasValue] = useState(false);

  const hasValue = value !== undefined ? String(value) !== "" : uncontrolledHasValue;
  const floated = focused || hasValue;

  return (
    <div className="relative">
      <input
        className={cn(
          "peer w-full px-4 py-3 border rounded-lg bg-transparent outline-none",
          "border-border focus:border-primary transition-colors",
          className
        )}
        placeholder=" "
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          setUncontrolledHasValue(e.target.value !== "");
          onBlur?.(e);
        }}
        onChange={(e) => {
          setUncontrolledHasValue(e.target.value !== "");
          onChange?.(e);
        }}
        {...props}
      />
      <label
        className={cn(
          "absolute left-4 top-3 text-muted-foreground transition-all duration-200 pointer-events-none",
          // The lifted label sits on top of the field's border, so it needs an
          // opaque background to punch a gap in that line rather than crossing it.
          floated && "-top-2.5 left-3 text-xs bg-card px-1",
          focused && "text-primary"
        )}
      >
        {label}
      </label>
    </div>
  );
}
