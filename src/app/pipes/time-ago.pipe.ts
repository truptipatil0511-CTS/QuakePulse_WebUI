import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', pure: false, standalone: false })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '—';
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
}
