import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { LogEntry, LogLevel } from '../models/log-entry.model';
import { environment } from '../../environments/environment';

/**
 * Ships frontend logs to the backend POST /api/logs endpoint.
 *
 * Logging is fire-and-forget: each call subscribes internally and returns
 * immediately, so the UI is never blocked waiting on the network. If the
 * request fails (offline, backend down, etc.) it degrades silently to the
 * browser console rather than surfacing errors to the user.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly endpoint = `${environment.apiBaseUrl}/api/logs`;

  constructor(private http: HttpClient) {}

  logInfo(message: string): void {
    this.send(message, 'Info');
  }

  logWarning(message: string): void {
    this.send(message, 'Warning');
  }

  logError(message: string): void {
    this.send(message, 'Error');
  }

  private send(message: string, level: LogLevel): void {
    const entry: LogEntry = {
      message,
      level,
      correlationId: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.http
      .post(this.endpoint, entry)
      .pipe(
        catchError(err => {
          // Never let logging failures bubble up to the UI.
          console[level === 'Error' ? 'error' : 'warn'](
            `[LoggerService] Failed to ship log (${entry.correlationId})`,
            { entry, err }
          );
          return EMPTY;
        })
      )
      .subscribe();
  }
}
