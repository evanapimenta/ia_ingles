import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SubmissionComponent } from './pages/submission/submission.component';
import { VfuComponent } from './pages/vfu/vfu.component';
import { ReportComponent } from './pages/report/report.component';
import { HistoryComponent } from './pages/history/history.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'submit', component: SubmissionComponent },
  { path: 'vfu/:sessionId', component: VfuComponent },
  { path: 'report/:sessionId', component: ReportComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: 'dashboard' }
];
