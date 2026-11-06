import { randomUUID } from "node:crypto";

const requestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

export function resolveRequestId(candidate: string | undefined): string {
  return candidate && requestIdPattern.test(candidate) ? candidate : randomUUID();
}
