"use client";

import { InputHTMLAttributes, forwardRef } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | undefined;
  required?: boolean;
  fullWidth?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, required, fullWidth = true, className = "", id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text mb-1.5"
        >
          {label}
          {required && (
            <span className="text-danger ml-1" aria-hidden="true">*</span>
          )}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : "false"}
          className={`
            w-full px-4 py-2.5 text-text placeholder-muted
            bg-surface border border-border rounded-lg
            transition-colors duration-150
            placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-danger focus:ring-danger focus:border-danger" : ""}
            ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

TextField.displayName = "TextField";

export default TextField;