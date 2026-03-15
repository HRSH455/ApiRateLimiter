import { Component, signal } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigEditorComponent } from './components/config-editor/config-editor.component';
import { RequestTesterComponent } from './components/request-tester/request-tester.component';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent, ConfigEditorComponent, RequestTesterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('API Rate Limiter');
}
