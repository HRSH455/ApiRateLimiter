import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container">
      <div *ngFor="let row of rowsArray"
           class="skeleton-row skeleton"></div>
    </div>
  `,
  styleUrls: ['./skeleton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
  @Input() rows = 4;

  get rowsArray() {
    return Array(this.rows).fill(0);
  }
}