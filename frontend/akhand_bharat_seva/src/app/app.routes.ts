import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ReportComponent } from './pages/report/report.component';
import { TrackComponent } from './pages/track/track.component';
import { PublicIssuesComponent } from './pages/public-issues/public-issues.component';
import { HelpComponent } from './pages/help/help.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout.component';
import { AdminOverviewComponent } from './pages/admin/admin-overview.component';
import { AdminPriorityQueueComponent } from './pages/admin/admin-priority-queue.component';
import { AdminAllComplaintsComponent } from './pages/admin/admin-all-complaints.component';
import { AdminMapComponent } from './pages/admin/admin-map.component';
import { AdminDepartmentsComponent } from './pages/admin/admin-departments.component';
import { AdminAnalyticsComponent } from './pages/admin/admin-analytics.component';
import { AdminSettingsComponent } from './pages/admin/admin-settings.component';
import { AdminLoginComponent } from './pages/admin/admin-login.component';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'report', component: ReportComponent },
  { path: 'track', component: TrackComponent },
  { path: 'public-issues', component: PublicIssuesComponent },
  { path: 'help', component: HelpComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverviewComponent },
      { path: 'priority-queue', component: AdminPriorityQueueComponent },
      { path: 'all-complaints', component: AdminAllComplaintsComponent },
      { path: 'map', component: AdminMapComponent },
      { path: 'departments', component: AdminDepartmentsComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'settings', component: AdminSettingsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
