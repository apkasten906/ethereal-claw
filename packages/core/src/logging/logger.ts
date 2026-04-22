import pino from "pino";

export function createLogger() {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? "info"
    },
    pino.destination({ fd: 2, sync: false })
  );
}
