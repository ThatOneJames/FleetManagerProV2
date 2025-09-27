import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'FleetManager Pro';
    currentUser: User | null = null;
    isLoading = true;
    sidebarOpen = true;

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
                { title: 'Fleet Management', icon: 'local_shipping', route: '/admin/fleet' },
                { title: 'Route Optimization', icon: 'route', route: '/admin/routes' },
                { title: 'Maintenance', icon: 'build', route: '/admin/maintenance' }
            ]
        },
        {
            title: 'System',
            items: [{ title: 'Settings', icon: 'settings', route: '/admin/settings' }]
        }
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
                { title: 'Profile', icon: 'person', route: '/driver/profile' },
                { title: 'Notifications', icon: 'notifications', route: '/driver/notifications' }
            ]
        }
    ];

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
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
                        const defaultRoute = user.role === 'Admin' ? '/admin/dashboard' : '/driver/dashboard'; // String comparison
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
        return this.currentUser?.role === 'Admin' // String comparison
            ? this.adminNavigationItems
            : this.driverNavigationItems;
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
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