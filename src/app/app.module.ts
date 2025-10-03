import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Components
import { LoginComponent } from './components/auth/login/login.component';
import { DriverDashboardComponent } from './components/driver/dashboard/dashboard.component';
import { AdminDashboardComponent } from './components/admin/dashboard/dashboard.component';
import { DriverManagementComponent } from './components/admin/driver-management/driver-management.component';
import { FleetManagementComponent } from './components/admin/fleet-management/fleet-management.component';
import { RouteOptimizationComponent } from './components/admin/route-optimization/route-optimization.component';
import { MaintenanceComponent } from './components/admin/maintenance/maintenance.component';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component';
import { LeaveRequestsComponent } from './components/driver/leave-requests/leave-requests.component';
import { UserComponent } from './components/user/user.component';
import { DriverAttendanceComponent } from './components//driver/attendance/attendance.component';
import { LeaveManagementComponent } from './components/admin/leave-management/leave-management.component';

// Services
import { AuthService } from './services/auth.service';
import { DriverService } from './services/driver.service';
import { VehicleService } from './services/vehicle.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        DriverDashboardComponent,
        AdminDashboardComponent,
        DriverManagementComponent,
        DriverAttendanceComponent,
        FleetManagementComponent,
        RouteOptimizationComponent,
        MaintenanceComponent,
        SidebarComponent,
        LeaveRequestsComponent,
        UserComponent,
        LeaveManagementComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        RouterModule,

        // Angular Material Modules
        MatSidenavModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatCardModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatDialogModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ],
    providers: [
        AuthService,
        DriverService,
        VehicleService,
        provideAnimationsAsync(),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }