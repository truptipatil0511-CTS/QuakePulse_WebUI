import { Pipe, PipeTransform } from '@angular/core';

// Pure so it only recomputes when its input changes (i.e. on data reload),
// instead of on every change-detection cycle. Previously pure:false caused
// transform() to run for every bound row on every CD tick — a major hot path
// in the list view. The "Xm ago" label therefore refreshes on data reload,
// not continuously; acceptable for an earthquake feed.
@Pipe({ name: 'timeAgo', pure: true, standalone: false })
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
