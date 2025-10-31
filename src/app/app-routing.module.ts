import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { UserComponent } from './components/user/user.component';

// Admin Component imports
import { AdminDashboardComponent } from './components/admin/dashboard/dashboard.component';
import { DriverManagementComponent } from './components/admin/driver-management/driver-management.component';
import { FleetManagementComponent } from './components/admin/fleet-management/fleet-management.component';
import { RouteOptimizationComponent } from './components/admin/route-optimization/route-optimization.component';
import { MaintenanceComponent } from './components/admin/maintenance/maintenance.component';
import { LeaveManagementComponent } from './components/admin/leave-management/leave-management.component';
import { AuditViewerComponent } from './components/admin/audit-viewer/audit-viewer.component';

// Driver Component imports
import { DriverDashboardComponent } from './components/driver/dashboard/dashboard.component';
import { RoutesTripsComponent } from './components/driver/routes-trips/routes-trips.component';
import { DriverAttendanceComponent } from './components/driver/attendance/attendance.component';
import { LeaveRequestsComponent } from './components/driver/leave-requests/leave-requests.component';
import { NotificationsComponent } from './components/driver/notifications/notifications.component';
import { DriverProfileComponent } from './components/driver/profile/profile.component';
import { PreTripInspectionComponent } from './components/driver/pre-trip-inspection/pre-trip-inspection.component';
import { SystemManagementComponent } from './components/admin/system-management/system-management.component';


// Auth Guard (to be implemented)
// import { AuthGuard } from './guards/auth.guard';
// import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  // Default route
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Authentication routes
  { path: 'login', component: LoginComponent },
  
  // Admin routes (protected by AuthGuard and AdminGuard)
  {
    path: 'admin',
    // canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'drivers', component: DriverManagementComponent },
      { path: 'fleet', component: FleetManagementComponent },
      { path: 'routes', component: RouteOptimizationComponent },
      { path: 'maintenance', component: MaintenanceComponent },
        { path: 'leave-management', component: LeaveManagementComponent },
        { path: 'system-management', component: SystemManagementComponent },
        { path: 'audit-logs', component: AuditViewerComponent }
    ]
  },
  
  // Driver routes (protected by AuthGuard)
    {
     path: 'driver',
     children: [
       { path: 'dashboard', component: DriverDashboardComponent },
       { path: 'routes', component: RoutesTripsComponent },
       { path: 'attendance', component: DriverAttendanceComponent },
       { path: 'leave', component: LeaveRequestsComponent },
       { path: 'notifications', component: NotificationsComponent },
       { path: 'profile', component: DriverProfileComponent },
       { path: 'pre-trip-inspection', component: PreTripInspectionComponent },
       { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
    }
,
  
  // Wildcard route - must be last
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: true, // Set to true for debugging
    useHash: false,
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }