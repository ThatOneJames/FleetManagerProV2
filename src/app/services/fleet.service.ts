import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: 'active' | 'maintenance' | 'idle' | 'out_of_service';
  driverId?: string;
  driverName?: string;
  currentLocationLat?: number;
  currentLocationLng?: number;
  currentMileage: number;
  fuelLevel: number;
  fuelCapacity: number;
  categoryId: number;
  category?: VehicleCategory;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: Date;
  experienceYears: number;
  isAvailable: boolean;
  currentVehicleId?: string;
  safetyRating: number;
  totalMilesDriven: number;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  vehicleId?: string;
  driverId?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'optimized';
  totalDistance: number;
  estimatedDuration: number;
  actualDuration?: number;
  fuelEstimate: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  stops: RouteStop[];
}

export interface RouteStop {
  id: number;
  routeId: string;
  address: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  estimatedArrival?: Date;
  actualArrival?: Date;
  estimatedDeparture?: Date;
  actualDeparture?: Date;
  status: 'pending' | 'arrived' | 'departed' | 'skipped';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  maintenanceType: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: Date;
  completedDate?: Date;
  cost: number;
  mileageAtService: number;
  nextServiceMileage?: number;
  serviceProvider?: string;
  notes?: string;
}

export interface VehicleCategory {
  id: number;
  name: string;
  description: string;
}

export interface DashboardStats {
  totalVehicles: number;
  totalDrivers: number;
  activeRoutes: number;
  maintenanceDue: number;
  fuelConsumption: number;
  totalMileage: number;
}

@Injectable({
  providedIn: 'root'
})
export class FleetService {
  private apiUrl = 'https://localhost:7000/api'; // Update with your API URL

  constructor(private http: HttpClient) {}

  // Dashboard Stats
  getDashboardStats(): Observable<DashboardStats> {
    // Mock data - replace with actual API call
    const mockStats: DashboardStats = {
      totalVehicles: 25,
      totalDrivers: 18,
      activeRoutes: 12,
      maintenanceDue: 3,
      fuelConsumption: 2456.78,
      totalMileage: 125478
    };

    return of(mockStats).pipe(delay(500)); // Simulate API delay
  }

  // Vehicle Management
  getVehicles(): Observable<Vehicle[]> {
    const mockVehicles: Vehicle[] = [
      {
        id: 'V001',
        licensePlate: 'ABC-123',
        make: 'Ford',
        model: 'Transit',
        year: 2022,
        vin: '1FTBW2CM5NKA12345',
        status: 'active',
        driverId: 'D001',
        driverName: 'John Smith',
        currentMileage: 45678,
        fuelLevel: 85,
        fuelCapacity: 80,
        categoryId: 2,
        currentLocationLat: 40.7128,
        currentLocationLng: -74.0060
      },
      {
        id: 'V002', 
        licensePlate: 'XYZ-456',
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2021,
        vin: '1GCRYSE70MZ123456',
        status: 'maintenance',
        currentMileage: 62341,
        fuelLevel: 45,
        fuelCapacity: 98,
        categoryId: 1
      },
      {
        id: 'V003',
        licensePlate: 'DEF-789',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        vin: '4T1C11AK5PU123457',
        status: 'active',
        driverId: 'D002',
        driverName: 'Jane Doe',
        currentMileage: 23456,
        fuelLevel: 92,
        fuelCapacity: 60,
        categoryId: 3
      }
    ];

    return of(mockVehicles).pipe(delay(500));
  }

  getVehicleById(id: string): Observable<Vehicle | null> {
    return this.getVehicles().pipe(
      map(vehicles => vehicles.find(v => v.id === id) || null)
    );
  }

  // Driver Management
  getDrivers(): Observable<Driver[]> {
    const mockDrivers: Driver[] = [
      {
        id: 'D001',
        userId: 'driver001',
        name: 'John Smith',
        email: 'john.smith@fleetmanager.com',
        phone: '+1-555-0101',
        licenseNumber: 'D123456789',
        licenseClass: 'CDL-A',
        licenseExpiry: new Date('2025-12-31'),
        experienceYears: 8,
        isAvailable: true,
        currentVehicleId: 'V001',
        safetyRating: 4.8,
        totalMilesDriven: 150000
      },
      {
        id: 'D002',
        userId: 'driver002', 
        name: 'Jane Doe',
        email: 'jane.doe@fleetmanager.com',
        phone: '+1-555-0102',
        licenseNumber: 'D987654321',
        licenseClass: 'CDL-B',
        licenseExpiry: new Date('2024-08-15'),
        experienceYears: 5,
        isAvailable: true,
        currentVehicleId: 'V003',
        safetyRating: 4.6,
        totalMilesDriven: 89000
      }
    ];

    return of(mockDrivers).pipe(delay(500));
  }

  getDriverById(id: string): Observable<Driver | null> {
    return this.getDrivers().pipe(
      map(drivers => drivers.find(d => d.id === id) || null)
    );
  }

  // Route Management
  getRoutes(): Observable<Route[]> {
    const mockRoutes: Route[] = [
      {
        id: 'R001',
        name: 'Downtown Delivery Route',
        description: 'Daily delivery route covering downtown area',
        vehicleId: 'V001',
        driverId: 'D001',
        status: 'active',
        totalDistance: 45.7,
        estimatedDuration: 180,
        fuelEstimate: 12.3,
        startTime: new Date(),
        createdAt: new Date(),
        stops: [
          {
            id: 1,
            routeId: 'R001',
            address: '123 Main St, Downtown',
            latitude: 40.7589,
            longitude: -73.9851,
            stopOrder: 1,
            status: 'departed',
            priority: 'high',
            estimatedArrival: new Date(Date.now() + 30 * 60000),
            actualArrival: new Date(Date.now() - 15 * 60000),
            actualDeparture: new Date(Date.now() - 5 * 60000)
          }
        ]
      }
    ];

    return of(mockRoutes).pipe(delay(500));
  }

  // Maintenance Management
  getMaintenanceRecords(): Observable<MaintenanceRecord[]> {
    const mockMaintenance: MaintenanceRecord[] = [
      {
        id: 'M001',
        vehicleId: 'V002',
        maintenanceType: 'preventive',
        description: 'Routine 10,000 mile service',
        status: 'in_progress',
        priority: 'medium',
        scheduledDate: new Date(),
        cost: 450.00,
        mileageAtService: 62341,
        nextServiceMileage: 72341,
        serviceProvider: 'Fleet Service Center',
        notes: 'Oil change, tire rotation, brake inspection'
      }
    ];

    return of(mockMaintenance).pipe(delay(500));
  }

  // Vehicle Categories
  getVehicleCategories(): Observable<VehicleCategory[]> {
    const categories: VehicleCategory[] = [
      { id: 1, name: 'Truck', description: 'Large cargo vehicles for heavy-duty transport' },
      { id: 2, name: 'Van', description: 'Medium-sized delivery vehicles' },
      { id: 3, name: 'Car', description: 'Standard passenger vehicles' },
      { id: 4, name: 'SUV', description: 'Sport utility vehicles for various purposes' },
      { id: 5, name: 'Motorcycle', description: 'Two-wheeled vehicles for quick delivery' }
    ];

    return of(categories);
  }

  // Real API methods would look like this:
  /*
  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`);
  }

  createVehicle(vehicle: Vehicle): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.apiUrl}/vehicles`, vehicle);
  }

  updateVehicle(id: string, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.apiUrl}/vehicles/${id}`, vehicle);
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicles/${id}`);
  }
  */

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token'); // or get from AuthService
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}