import pino, { type DestinationStream, type Logger, type LoggerOptions } from "pino";

const redactedPaths = [
  "authorization",
  "cookie",
  "headers.authorization",
  "headers.cookie",
  "headers.set-cookie",
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "otp",
  "token",
  "secret",
  "apiKey",
  "api_key",
];

export function createLogger(
  name: string,
  level = "info",
  destination?: DestinationStream,
): Logger {
  const options: LoggerOptions = {
    name,
    level,
    redact: { paths: redactedPaths, censor: "[REDACTED]" },
    messageKey: "message",
    base: { service: name },
  };
  return pino(options, destination);
}

export type AppLogger = Logger;
