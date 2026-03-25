import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge status-badge"
          [ngClass]="getStatusClass()">
      {{ status }}
    </span>
  `,
  styleUrls: ['./status-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input() status!: number;

  getStatusClass(): string {
    if (this.status >= 200 && this.status < 300) {
      return 'success';
    } else if (this.status >= 400 && this.status < 600) {
      return 'error';
    } else {
      return 'warning';
    }
  }
}