import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'magnitudeClass', pure: true, standalone: false })
export class MagnitudeClassPipe implements PipeTransform {
  transform(magnitude: number): string {
    if (magnitude < 3) return 'minor';
    if (magnitude < 5) return 'moderate';
    if (magnitude < 7) return 'strong';
    return 'major';
  }
}
