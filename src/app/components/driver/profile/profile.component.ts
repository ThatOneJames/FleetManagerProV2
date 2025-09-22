import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-driver-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class DriverProfileComponent implements OnInit {
    isEditing = false;
    isLoading = false;

    driverDetails: any = {
        id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        hireDate: '',
        emergencyContact: '',
        profileImageUrl: ''
    };

    private apiUrl = 'http://localhost:5129/api/driver';

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.isLoading = true;

        this.route.paramMap.subscribe(params => {
            const driverId = params.get('id');
            if (driverId) {
                this.http.get(`${this.apiUrl}/${driverId}`).subscribe({
                    next: (data: any) => {
                        // Assuming the API response is a User object with a nested Driver object
                        if (data) {
                            this.driverDetails.id = data.id;
                            this.driverDetails.name = data.name;
                            this.driverDetails.email = data.email;

                            // Map properties from the nested Driver object
                            if (data.driver) {
                                this.driverDetails.phone = data.driver.contactNumber;
                                this.driverDetails.address = data.driver.currentAddress;
                                this.driverDetails.dateOfBirth = this.formatDate(data.driver.dateOfBirth);
                                this.driverDetails.hireDate = this.formatDate(data.driver.hireDate);
                                this.driverDetails.emergencyContact = data.driver.emergencyContact;
                                this.driverDetails.profileImageUrl = data.driver.profileImageUrl;
                            }
                        }
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Error fetching driver details:', err);
                        this.isLoading = false;
                    }
                });
            } else {
                this.isLoading = false;
            }
        });
    }

    // Utility function to format date strings to YYYY-MM-DD
    private formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
    }

    saveChanges() {
        if (this.driverDetails.id) {
            this.http.put(`${this.apiUrl}/${this.driverDetails.id}`, this.driverDetails)
                .subscribe({
                    next: () => {
                        alert('Profile updated successfully!');
                        this.isEditing = false;
                    },
                    error: (err) => console.error('Error updating driver profile:', err)
                });
        } else {
            console.error('Driver ID is missing. Cannot update profile.');
            alert('Could not save changes. Driver ID is missing.');
        }
    }
}
