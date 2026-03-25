import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigEditorComponent } from './components/config-editor/config-editor.component';
import { RequestTesterComponent } from './components/request-tester/request-tester.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'config', component: ConfigEditorComponent },
  { path: 'tester', component: RequestTesterComponent },
  { path: '**', redirectTo: '/dashboard' }
];
