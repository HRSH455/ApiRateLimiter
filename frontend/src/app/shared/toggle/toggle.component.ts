import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toggle"
         [ngClass]="{ 'enabled': enabled }"
         (click)="onToggle()">
      <div class="toggle-knob"></div>
    </div>
  `,
  styleUrls: ['./toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleComponent {
  @Input() enabled = false;
  @Output() toggled = new EventEmitter<boolean>();

  onToggle() {
    this.enabled = !this.enabled;
    this.toggled.emit(this.enabled);
  }
}