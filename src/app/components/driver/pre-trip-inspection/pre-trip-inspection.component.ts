import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PreTripInspectionService, PreTripInspection } from '../../../services/pretripinspection.service';
import { MaintenanceRequestService } from '../../../services/maintenancerequest.service';
import { RouteService, Route } from '../../../services/route.service';

interface ChecklistItem {
    key: string;
    label: string;
    category: string;
    critical: boolean;
}

@Component({
    selector: 'app-pre-trip-inspection',
    templateUrl: './pre-trip-inspection.component.html',
    styleUrls: ['./pre-trip-inspection.component.css']
})
export class PreTripInspectionComponent implements OnInit {
    inspectionForm!: FormGroup;
    isSubmitting = false;
    errorMessage = '';
    successMessage = '';
    showMaintenanceForm = false;
    failedItems: string[] = [];

    availableRoutes: Route[] = [];
    selectedRoute: Route | null = null;
    loadingRoutes = true;
    showInspectionForm = false;

    checklistItems: ChecklistItem[] = [
        { key: 'engineOilOk', label: 'Engine Oil Level', category: 'Engine & Mechanical', critical: true },
        { key: 'coolantOk', label: 'Coolant Level', category: 'Engine & Mechanical', critical: true },
        { key: 'batteryOk', label: 'Battery Condition', category: 'Engine & Mechanical', critical: false },
        { key: 'brakesOk', label: 'Brake Fluid Level', category: 'Engine & Mechanical', critical: true },
        { key: 'dashboardWarningLights', label: 'No Dashboard Warning Lights', category: 'Engine & Mechanical', critical: true },
        { key: 'tirePressureOk', label: 'Tire Pressure (All Tires)', category: 'Tires & Wheels', critical: true },
        { key: 'tireTreadOk', label: 'Tire Tread Depth', category: 'Tires & Wheels', critical: true },
        { key: 'tireDamageCheck', label: 'No Visible Tire Damage', category: 'Tires & Wheels', critical: true },
        { key: 'wheelLugsOk', label: 'Wheel Lug Nuts Tight', category: 'Tires & Wheels', critical: true },
        { key: 'headlightsOk', label: 'Headlights Working', category: 'Lights & Signals', critical: true },
        { key: 'brakeLightsOk', label: 'Brake Lights Working', category: 'Lights & Signals', critical: true },
        { key: 'turnSignalsOk', label: 'Turn Signals Working', category: 'Lights & Signals', critical: true },
        { key: 'hazardLightsOk', label: 'Hazard Lights Working', category: 'Lights & Signals', critical: false },
        { key: 'seatbeltsOk', label: 'Seatbelts Functional', category: 'Safety Equipment', critical: true },
        { key: 'fireExtinguisherPresent', label: 'Fire Extinguisher Present', category: 'Safety Equipment', critical: true },
        { key: 'firstAidKitPresent', label: 'First Aid Kit Present', category: 'Safety Equipment', critical: false },
        { key: 'warningTrianglesPresent', label: 'Warning Triangles Present', category: 'Safety Equipment', critical: false },
        { key: 'mirrorsOk', label: 'Mirrors Clean & Adjusted', category: 'Exterior & Interior', critical: false },
        { key: 'windshieldWipersOk', label: 'Windshield Wipers Working', category: 'Exterior & Interior', critical: false },
        { key: 'hornWorking', label: 'Horn Working', category: 'Exterior & Interior', critical: false },
        { key: 'doorsAndLocksOk', label: 'Doors and Locks Working', category: 'Exterior & Interior', critical: false }
    ];

    constructor(
        private fb: FormBuilder,
        private inspectionService: PreTripInspectionService,
        private maintenanceService: MaintenanceRequestService,
        private routeService: RouteService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadMyRoutes();
    }

    private loadMyRoutes(): void {
        this.loadingRoutes = true;

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const driverId = currentUser.id;

        if (!driverId) {
            this.errorMessage = 'Driver ID not found';
            this.loadingRoutes = false;
            return;
        }

        this.routeService.getRoutesByDriver(driverId).subscribe({
            next: (routes: Route[]) => {
                this.availableRoutes = routes.filter((r: Route) =>
                    r.status === 'planned' || r.status === 'in_progress'
                );
                this.loadingRoutes = false;
            },
            error: (error: any) => {
                console.error('Error loading routes:', error);
                this.errorMessage = 'Failed to load routes';
                this.loadingRoutes = false;
            }
        });
    }

    selectRoute(route: Route): void {
        this.selectedRoute = route;
        this.showInspectionForm = true;
        this.errorMessage = '';
        this.successMessage = '';
    }

    backToRoutes(): void {
        this.selectedRoute = null;
        this.showInspectionForm = false;
        this.showMaintenanceForm = false;
        this.inspectionForm.reset();
        this.loadMyRoutes();
    }

    cancel(): void {
        this.router.navigate(['/driver/routes']);
    }

    private initializeForm(): void {
        const formControls: any = {
            notes: ['']
        };

        this.checklistItems.forEach(item => {
            formControls[item.key] = [false];
        });

        this.inspectionForm = this.fb.group(formControls);
    }

    getItemsByCategory(category: string): ChecklistItem[] {
        return this.checklistItems.filter(item => item.category === category);
    }

    getCategories(): string[] {
        return Array.from(new Set(this.checklistItems.map(item => item.category)));
    }

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'planned': return 'status-planned';
            case 'in_progress': return 'status-in_progress';
            case 'completed': return 'status-completed';
            default: return '';
        }
    }

    submitInspection(): void {
        if (!this.selectedRoute) {
            this.errorMessage = 'No route selected';
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        const formValue = this.inspectionForm.value;
        const inspection: PreTripInspection = {
            routeId: this.selectedRoute.id!,
            vehicleId: this.selectedRoute.vehicleId!,
            ...formValue
        };

        this.inspectionService.createInspection(inspection).subscribe({
            next: (response: any) => {
                console.log('Inspection created:', response);

                if (!response.allItemsPassed) {
                    this.failedItems = this.getFailedItemsLabels();
                    this.showMaintenanceForm = true;
                    this.isSubmitting = false;
                } else {
                    this.successMessage = 'Pre-trip inspection passed! Redirecting to routes...';
                    this.isSubmitting = false;

                    setTimeout(() => {
                        window.location.href = '/driver/routes';
                    }, 1500);
                }
            },
            error: (error: any) => {
                console.error('Error creating inspection:', error);
                this.errorMessage = error.error?.message || 'Failed to submit inspection';
                this.isSubmitting = false;
            }
        });
    }

    private getFailedItemsLabels(): string[] {
        const failed: string[] = [];
        const formValue = this.inspectionForm.value;

        this.checklistItems.forEach(item => {
            if (!formValue[item.key]) {
                failed.push(item.label);
            }
        });

        return failed;
    }

    onMaintenanceRequestSubmitted(maintenanceRequestId: string): void {
        this.successMessage = 'Maintenance request submitted. Route has been put on hold.';
        this.showMaintenanceForm = false;
        setTimeout(() => {
            this.router.navigate(['/driver/routes']);
        }, 2000);
    }

    getCriticalFailures(): string[] {
        const formValue = this.inspectionForm.value;
        return this.checklistItems
            .filter(item => item.critical && !formValue[item.key])
            .map(item => item.label);
    }

    hasCriticalFailures(): boolean {
        return this.getCriticalFailures().length > 0;
    }

    get route(): Route | null {
        return this.selectedRoute;
    }
}
