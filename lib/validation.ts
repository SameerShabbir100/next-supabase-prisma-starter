// Minimal hand-rolled validation — no external dependency.
// Deliberately simple: these are format checks, not full RFC validation.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value);
}

export function isValidPassword(value: unknown): value is string {
  // bcrypt silently truncates beyond 72 bytes, so longer input wouldn't
  // do anything useful — reject it explicitly instead.
  return typeof value === "string" && value.length >= 8 && value.length <= 72;
}

export function isValidName(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 100;
}

export function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
