import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfigEditorComponent } from './components/config-editor/config-editor.component';
import { RequestTesterComponent } from './components/request-tester/request-tester.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent},
  { path: 'config', component: ConfigEditorComponent, canActivate: [AuthGuard] },
  { path: 'tester', component: RequestTesterComponent },
  { path: '**', redirectTo: '/login' }
];