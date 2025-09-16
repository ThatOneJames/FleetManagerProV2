import { Component } from '@angular/core';

interface Route {
    name: string;
    origin: string;
    destination: string;
    type: string;      // Shortest or Fastest
    distance: number;  // in km
    time: number;      // in mins
}

@Component({
    selector: 'app-route-optimization',
    templateUrl: './route-optimization.component.html',
    styleUrls: ['./route-optimization.component.css']
})
export class RouteOptimizationComponent {
    routes: Route[] = [
        { name: 'Route 1', origin: 'Manila', destination: 'Batangas', type: 'Shortest', distance: 110, time: 120 },
        { name: 'Route 2', origin: 'Cavite', destination: 'Laguna', type: 'Fastest', distance: 75, time: 90 }
    ];

    searchRoute: string = '';
    filterType: string = '';

    // Filter routes based on search and type
    filteredRoutes(): Route[] {
        return this.routes.filter(route =>
            (this.searchRoute === '' || route.name.toLowerCase().includes(this.searchRoute.toLowerCase())) &&
            (this.filterType === '' || route.type === this.filterType)
        );
    }

    // Add new route
    addRoute(newRoute: any): void {
        if (newRoute.name && newRoute.origin && newRoute.destination && newRoute.type && newRoute.distance && newRoute.time) {
            this.routes.push({
                name: newRoute.name,
                origin: newRoute.origin,
                destination: newRoute.destination,
                type: newRoute.type,
                distance: Number(newRoute.distance),
                time: Number(newRoute.time)
            });
        }
    }
}
