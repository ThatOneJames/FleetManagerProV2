import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaintenanceRequestService, MaintenanceRequest } from '../../../services/maintenancerequest.service';
import { Route } from '../../../services/route.service';

@Component({
    selector: 'app-maintenance-request',
    templateUrl: './maintenance-request.component.html',
    styleUrls: ['./maintenance-request.component.css']
})
export class MaintenanceRequestComponent implements OnInit {
    @Input() route?: Route;
    @Input() failedItems?: string[];
    @Input() inspectionNotes?: string;
    @Input() inspectionId?: string;
    @Output() requestSubmitted = new EventEmitter<string>();
    @Output() cancel = new EventEmitter<void>();

    requestForm!: FormGroup;
    isSubmitting = false;
    errorMessage = '';
    hasVehicleAssignment = false;
    isCheckingAssignment = true;

    issueTypes = [
        'Engine',
        'Transmission',
        'Brakes',
        'Tires',
        'Electrical',
        'Lights & Signals',
        'Safety Equipment',
        'Body & Exterior',
        'Interior',
        'Other'
    ];

    severityLevels = [
        { value: 'Critical', label: 'Critical - Cannot Operate' },
        { value: 'High', label: 'High - Safety Risk' },
        { value: 'Medium', label: 'Medium - Should Fix Soon' },
        { value: 'Low', label: 'Low - Minor Issue' }
    ];

    priorityLevels = [
        { value: 'Urgent', label: 'Urgent - Immediate Action Required' },
        { value: 'High', label: 'High Priority' },
        { value: 'Normal', label: 'Normal Priority' },
        { value: 'Low', label: 'Low Priority' }
    ];

    constructor(
        private fb: FormBuilder,
        private maintenanceService: MaintenanceRequestService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        if (this.route) {
            this.checkVehicleAssignment();
        }
    }

    private initializeForm(): void {
        const defaultDescription = this.buildDefaultDescription();

        this.requestForm = this.fb.group({
            issueType: ['', Validators.required],
            issueSeverity: ['High', Validators.required],
            priority: ['High', Validators.required],
            description: [defaultDescription, [Validators.required, Validators.minLength(10)]]
        });
    }

    private buildDefaultDescription(): string {
        if (!this.failedItems || this.failedItems.length === 0) {
            return '';
        }

        let description = 'Pre-trip inspection failures:\n\n';
        this.failedItems.forEach((item, index) => {
            description += `${index + 1}. ${item}\n`;
        });

        if (this.inspectionNotes) {
            description += `\nAdditional Notes:\n${this.inspectionNotes}`;
        }

        return description;
    }

    private checkVehicleAssignment(): void {
        if (!this.route?.vehicleId) {
            this.errorMessage = 'No vehicle assigned to this route';
            this.isCheckingAssignment = false;
            return;
        }

        this.maintenanceService.checkVehicleAssignment(this.route.vehicleId).subscribe({
            next: (response) => {
                this.hasVehicleAssignment = response.hasAssignment;
                if (!this.hasVehicleAssignment) {
                    this.errorMessage = 'You can only submit maintenance requests for vehicles assigned to you';
                }
                this.isCheckingAssignment = false;
            },
            error: (error) => {
                console.error('Error checking vehicle assignment:', error);
                this.errorMessage = 'Failed to verify vehicle assignment';
                this.isCheckingAssignment = false;
            }
        });
    }

    submitRequest(): void {
        if (this.requestForm.invalid) {
            this.errorMessage = 'Please fill out all required fields';
            return;
        }

        if (!this.hasVehicleAssignment && this.route) {
            this.errorMessage = 'You can only submit maintenance requests for vehicles assigned to you';
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        const formValue = this.requestForm.value;
        const request: MaintenanceRequest = {
            vehicleId: this.route!.vehicleId!,
            routeId: this.route?.id,
            inspectionId: this.inspectionId,
            issueType: formValue.issueType,
            issueSeverity: formValue.issueSeverity,
            description: formValue.description,
            priority: formValue.priority
        };

        this.maintenanceService.createRequest(request).subscribe({
            next: (response) => {
                console.log('Maintenance request created:', response);
                this.requestSubmitted.emit(response.id);
            },
            error: (error) => {
                console.error('Error creating maintenance request:', error);
                this.errorMessage = error.error?.message || 'Failed to submit maintenance request';
                this.isSubmitting = false;
            }
        });
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
