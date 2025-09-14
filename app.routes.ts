import {Routes} from '@angular/router';
import {LoginComponent} from './pages/login/login.component';
import {MainComponent} from './layout/main/main.component';
import { QueueSettings} from './pages/queue-settings/queue-settings.component';
import {StatisticalReportsComponent} from './pages/staistical-reports/statistical-reports.component';
import {ManageAgentsComponent} from './pages/manage-agents/manage-agents.component';
import {authGuard} from './service/auth/auth.guard';
import {UserManagementComponent} from './pages/user/user-management/user-management.component';
import {RoleManagementComponent} from './pages/user/role-managment/role-management.component';
import {UserProfileComponent} from './pages/user/user-profile/user-profile.component';
import {ChangePasswordComponent} from './pages/user/change-password/change-password.component';
import {WallboardComponent} from './pages/wallboard/wallboard.component';
import { AgentsQueueReportsComponent } from './pages/agents-queue-reports/agents-queue-reports.component';
import {QueueReportsComponent} from './pages/queue-reports/queue-reports.component';
import {AgentsPerformanceComponent} from './pages/performance/agents-performance/agents-performance.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: {hideLayout: true}
  },
  {
    path: '',
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      {path: 'users', component: UserManagementComponent},
      {path: 'roles', component: RoleManagementComponent},
      {path: 'wallboard', component:WallboardComponent },
      {path: 'queue-settings', component:QueueSettings },
      {path: 'manage-agents', component:ManageAgentsComponent },
      {path: 'agents-queue-report', component:AgentsQueueReportsComponent },
      {path: 'agents-performance', component:AgentsPerformanceComponent },
      {path: 'queue-reports', component:QueueReportsComponent },
      {path: 'statistical-report', component:StatisticalReportsComponent },
      {path: '', redirectTo: 'wallboard', pathMatch: 'full'},
      {path: 'profile', component: UserProfileComponent},
      {path: 'change-password', component: ChangePasswordComponent},
    ]
  },
  {path: '**', redirectTo: 'dashboard'}
];
