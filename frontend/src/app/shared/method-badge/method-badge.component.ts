import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-method-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge method-badge"
          [ngClass]="getMethodClass()">
      {{ method }}
    </span>
  `,
  styleUrls: ['./method-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MethodBadgeComponent {
  @Input() method!: string;

  getMethodClass(): string {
    const method = this.method.toUpperCase();
    switch (method) {
      case 'GET':
      case 'HEAD':
      case 'OPTIONS':
        return 'get';
      case 'POST':
      case 'PATCH':
        return 'post';
      case 'PUT':
        return 'put';
      case 'DELETE':
        return 'delete';
      default:
        return 'other';
    }
  }
}