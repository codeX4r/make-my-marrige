"use client";

import { useRef, useEffect, useCallback } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  onComplete?: (value: string) => void;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error,
  onComplete,
}: OTPInputProps) {
  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/\D/g, "").slice(0, 1);
      const newValueArray = value.split("");
      newValueArray[index] = newValue;
      const newValueStr = newValueArray.join("");
      onChange(newValueStr);

      if (newValue && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    },
    [length, onChange, value],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      if (e.key === "ArrowLeft" && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    },
    [value, length],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted.length > 0) {
        onChange(pasted);
        const lastFilled = Math.min(pasted.length, length) - 1;
        inputsRef.current[lastFilled]?.focus();
      }
    },
    [length, onChange],
  );

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      handleChange(index, e);
    }
  };

  return (
    <div
      className="flex gap-2"
      role="group"
      aria-label="One-time password"
      aria-describedby={error ? "otp-error" : undefined}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el: HTMLInputElement | null) => {
            if (el) inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete="one-time-code"
          value={value[i] || ""}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`
            w-10 h-12 sm:w-12 sm:h-14
            text-center text-lg sm:text-xl font-medium
            bg-surface border-2 rounded-lg
            border-border text-text
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-150
            ${error ? "border-danger focus:ring-danger focus:border-danger" : ""}
          `}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={error ? "true" : "false"}
        />
      ))}
      {error && (
        <p id="otp-error" className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default OTPInput;
