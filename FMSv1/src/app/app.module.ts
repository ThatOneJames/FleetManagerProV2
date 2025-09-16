import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

//Login Interceptors
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';


// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';

// Firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component';

//Admin Components
import { AdminDashboardComponent } from './components/admin/dashboard/dashboard.component';
import { DriverManagementComponent } from './components/admin/driver-management/driver-management.component';
import { FleetManagementComponent } from './components/admin/fleet-management/fleet-management.component';
import { RouteOptimizationComponent } from './components/admin/route-optimization/route-optimization.component';
import { MaintenanceComponent } from './components/admin/maintenance/maintenance.component';

//Driver Components
import { DriverDashboardComponent } from './components/driver/dashboard/dashboard.component';
import { DriverAttendanceComponent } from './components/driver/attendance/attendance.component';
import { LeaveRequestsComponent } from './components/driver/leave-requests/leave-requests.component';
import { DriverProfileComponent } from './components/driver/profile/profile.component';

// Services
import { AuthService } from './services/auth.service';
import { FleetService } from './services/fleet.service';



// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWvz4V-zBNAjOOPmqdBjdQlUTY1LIGnsk",
    authDomain: "fleetmanagerpro-31c36.firebaseapp.com",
    projectId: "fleetmanagerpro-31c36",
    storageBucket: "fleetmanagerpro-31c36.appspot.com",
    messagingSenderId: "855420387222",
    appId: "1:855420387222:web:0024156eb6354ddac9e7b7",
    measurementId: "G-5LEGRBK597"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminDashboardComponent,
    DriverManagementComponent,
    FleetManagementComponent,
    RouteOptimizationComponent,
    MaintenanceComponent,
    DriverDashboardComponent,
    DriverAttendanceComponent,
    LeaveRequestsComponent,
    DriverProfileComponent,
    SidebarComponent
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    
    // Firebase
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    
    // Angular Material
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule
  ],
  providers: [
    FleetService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }