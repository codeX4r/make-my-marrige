export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  if (email.length > 320) {
    return { valid: false, error: "Email address is too long" };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < 12) {
    return { valid: false, error: "Password must be at least 12 characters" };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }
  return { valid: true };
}

export function validateDisplayName(displayName: string): { valid: boolean; error?: string } {
  if (!displayName?.trim()) {
    return { valid: false, error: "Display name is required" };
  }
  if (displayName.trim().length > 100) {
    return { valid: false, error: "Display name is too long" };
  }
  return { valid: true };
}

export function validateOTP(otp: string, expectedLength = 6): { valid: boolean; error?: string } {
  if (!otp) {
    return { valid: false, error: "Verification code is required" };
  }
  if (otp.length !== expectedLength) {
    return { valid: false, error: `Verification code must be ${expectedLength} digits` };
  }
  if (!/^\d+$/.test(otp)) {
    return { valid: false, error: "Verification code must contain only digits" };
  }
  return { valid: true };
}

export function validateRequired(value: string, fieldName: string): { valid: boolean; error?: string } {
  if (!value?.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export type ValidationResult<T> = {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
};

export function validateForm<T extends Record<string, unknown>>(
  data: T,
  validators: Record<keyof T, (value: unknown) => { valid: boolean; error?: string }>,
): ValidationResult<T> {
  const errors: Partial<Record<keyof T, string>> = {};
  let valid = true;

  for (const [key, validator] of Object.entries(validators)) {
    const result = validator(data[key]);
    if (!result.valid) {
      errors[key as keyof T] = result.error;
      valid = false;
    }
  }

  return { valid, errors };
}