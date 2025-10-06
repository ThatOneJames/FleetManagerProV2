import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    @ViewChild('sidenav') sidenav!: MatSidenav;

    title = 'FleetManager Pro';
    currentUser: User | null = null;
    isLoading = true;
    sidebarOpen = true;
    isMobile = false;

    // Admin navigation
    adminNavigationItems = [
        {
            title: 'Overview',
            items: [{ title: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' }]
        },
        {
            title: 'Fleet Operations',
            items: [
                { title: 'Driver Management', icon: 'people', route: '/admin/drivers' },
                { title: 'Leave Management', icon: 'event_note', route: '/admin/leave-management' },
                { title: 'Fleet Management', icon: 'local_shipping', route: '/admin/fleet' },
                { title: 'Route Optimization', icon: 'route', route: '/admin/routes' },
                { title: 'Maintenance', icon: 'build', route: '/admin/maintenance' }
            ]
        },
    ];

    // Driver navigation
    driverNavigationItems = [
        {
            title: 'Overview',
            items: [{ title: 'Dashboard', icon: 'dashboard', route: '/driver/dashboard' }]
        },
        {
            title: 'My Work',
            items: [
                { title: 'Routes & Trips', icon: 'route', route: '/driver/routes' },
                { title: 'Attendance', icon: 'schedule', route: '/driver/attendance' },
                { title: 'Leave Requests', icon: 'description', route: '/driver/leave' }
            ]
        },
        {
            title: 'Personal',
            items: [
                { title: 'Notifications', icon: 'notifications', route: '/driver/notifications' }
            ]
        }
    ];

    constructor(
        private authService: AuthService,
        private router: Router,
        private breakpointObserver: BreakpointObserver
    ) { }

    ngOnInit(): void {
        // Detect mobile/tablet
        this.breakpointObserver.observe([
            Breakpoints.Handset,
            Breakpoints.Tablet
        ]).subscribe(result => {
            this.isMobile = result.matches;
            this.sidebarOpen = !this.isMobile; // Auto-close on mobile
        });

        // Close sidebar on route change (mobile only)
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd && this.isMobile && this.sidenav) {
                this.sidenav.close();
            }
        });

        // Subscribe to authentication state changes
        this.authService.currentUser$.subscribe({
            next: (user: User | null) => {
                this.currentUser = user;
                this.isLoading = false;

                if (!user) {
                    this.router.navigate(['/login']);
                } else {
                    // Redirect to appropriate dashboard based on role
                    if (this.router.url === '/login' || this.router.url === '/') {
                        const defaultRoute = user.role === 'Admin' ? '/admin/dashboard' : '/driver/dashboard';
                        this.router.navigate([defaultRoute]);
                    }
                }
            },
            error: (error: unknown) => {
                console.error('Authentication error:', error);
                this.isLoading = false;
                this.router.navigate(['/login']);
            }
        });
    }

    get navigationItems() {
        return this.currentUser?.role === 'Admin'
            ? this.adminNavigationItems
            : this.driverNavigationItems;
    }

    get sidenavMode() {
        return this.isMobile ? 'over' : 'side';
    }

    toggleSidebar(): void {
        if (this.sidenav) {
            this.sidenav.toggle();
        }
    }

    onLogout(): void {
        try {
            this.authService.logout();
            this.currentUser = null;
            this.router.navigate(['/login']);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    isActiveRoute(route: string): boolean {
        return this.router.url === route;
    }
}
