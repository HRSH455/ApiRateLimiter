import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigEditorComponent } from './components/config-editor/config-editor.component';
import { RequestTesterComponent } from './components/request-tester/request-tester.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, DashboardComponent, ConfigEditorComponent, RequestTesterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  title = 'API Rate Limiter';
  currentView: 'dashboard' | 'config' | 'tester' = 'dashboard';
}
