import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';

interface NavigationGroup {
    title: string;
    items: NavigationItem[];
}

interface NavigationItem {
    title: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnChanges {
    @Input() user: User | null = null;
    @Output() logout = new EventEmitter<void>();

    navigationItems: NavigationGroup[] = [];

    private adminNavigationItems: NavigationGroup[] = [
        {
            title: 'Overview',
            items: [
                { title: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' }
            ]
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
        {
            title: 'System',
            items: [
                { title: 'Settings', icon: 'settings', route: '/admin/settings' }
            ]
        }
    ];

    private driverNavigationItems: NavigationGroup[] = [
        {
            title: 'Overview',
            items: [
                { title: 'Dashboard', icon: 'dashboard', route: '/driver/dashboard' }
            ]
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

    constructor(private router: Router) { }

    ngOnChanges(): void {
        if (this.user) {
            this.navigationItems = this.user.role === 'Admin'
                ? this.adminNavigationItems
                : this.driverNavigationItems;
        } else {
            this.navigationItems = [];
        }
    }

    onLogout(): void {
        this.logout.emit();
    }

    isActiveRoute(route: string): boolean {
        return this.router.url.startsWith(route);
    }
}