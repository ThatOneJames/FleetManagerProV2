    import { NgModule, APP_INITIALIZER } from '@angular/core';
    import { BrowserModule } from '@angular/platform-browser';
    import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
    import { ReactiveFormsModule, FormsModule } from '@angular/forms';
    import { HttpClientModule } from '@angular/common/http';
    import { RouterModule } from '@angular/router';

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
    import { MatTabsModule } from '@angular/material/tabs';
    import { MatTooltipModule } from '@angular/material/tooltip';
    import { MatSlideToggleModule } from '@angular/material/slide-toggle';
    import { MatBadgeModule } from '@angular/material/badge';
    import { MatChipsModule } from '@angular/material/chips';

    import { AppRoutingModule } from './app-routing.module';
    import { AppComponent } from './app.component';
    import { HTTP_INTERCEPTORS } from '@angular/common/http';
    import { AuthInterceptor } from './interceptors/auth.interceptor';
    import { VerifyEmailComponent } from './components/auth/verify-email/verify-email.component';

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
    import { DriverProfileComponent } from './components/driver/profile/profile.component';
    import { PreTripInspectionComponent } from './components/driver/pre-trip-inspection/pre-trip-inspection.component';
    import { MaintenanceRequestComponent } from './components/driver/maintenance-request/maintenance-request.component';
    import { SystemManagementComponent } from './components/admin/system-management/system-management.component';

    import { AuthService } from './services/auth.service';
    import { DriverService } from './services/driver.service';
    import { VehicleService } from './services/vehicle.service';
    import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

    export function initializeRecaptcha(): () => Promise<void> {
        return () => {
            return new Promise((resolve) => {
                const checkRecaptcha = () => {
                    if ((window as any).grecaptcha) {
                        console.log('reCAPTCHA is ready');
                        resolve();
                    } else {
                        setTimeout(checkRecaptcha, 100);
                    }
                };
                checkRecaptcha();
            });
        };
    }

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
            LeaveManagementComponent,
            DriverProfileComponent,
            PreTripInspectionComponent,
            MaintenanceRequestComponent,
            VerifyEmailComponent,
            SystemManagementComponent
        ],
        imports: [
            BrowserModule,
            BrowserAnimationsModule,
            AppRoutingModule,
            ReactiveFormsModule,
            FormsModule,
            HttpClientModule,
            RouterModule,
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
            MatTabsModule,
            MatTooltipModule,
            MatSlideToggleModule,
            MatBadgeModule,
            MatChipsModule
        ],
        providers: [
            AuthService,
            DriverService,
            VehicleService,
            provideAnimationsAsync(),
            {
                provide: APP_INITIALIZER,
                useFactory: initializeRecaptcha,
                multi: true
            },
            {
                provide: HTTP_INTERCEPTORS,
                useClass: AuthInterceptor,
                multi: true
            }
        ],
        bootstrap: [AppComponent]
    })
    export class AppModule { }
