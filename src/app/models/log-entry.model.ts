/** Severity levels accepted by the backend POST /api/logs contract. */
export type LogLevel = 'Info' | 'Warning' | 'Error';

/**
 * Request body for POST /api/logs. Matches the backend logging contract:
 * `timestamp` and `correlationId` are populated automatically by LoggerService.
 */
export interface LogEntry {
  message: string;
  level: LogLevel;
  correlationId: string;
  timestamp: Date;
}
