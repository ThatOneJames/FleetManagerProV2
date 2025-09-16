import { Component, OnInit } from '@angular/core';
import { FleetService } from '../../../services/fleet.service';

interface DashboardStats {
  totalVehicles: number;
  totalDrivers: number;
  activeRoutes: number;
  maintenanceDue: number;
  fuelConsumption: number;
  totalMileage: number;
}

interface VehicleStatus {
  id: string;
  licensePlate: string;
  driver: string;
  status: 'active' | 'maintenance' | 'idle';
  location: string;
  fuelLevel: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalVehicles: 0,
    totalDrivers: 0,
    activeRoutes: 0,
    maintenanceDue: 0,
    fuelConsumption: 0,
    totalMileage: 0
  };

  vehicles: VehicleStatus[] = [];
  recentActivities: any[] = [];
  isLoading = true;

  // Chart data
  chartData = {
    fuelConsumption: [
      { name: 'Mon', value: 120 },
      { name: 'Tue', value: 150 },
      { name: 'Wed', value: 180 },
      { name: 'Thu', value: 140 },
      { name: 'Fri', value: 200 },
      { name: 'Sat', value: 160 },
      { name: 'Sun', value: 130 }
    ],
    vehicleStatus: [
      { name: 'Active', value: 15, color: '#4caf50' },
      { name: 'Maintenance', value: 3, color: '#ff9800' },
      { name: 'Idle', value: 7, color: '#9e9e9e' }
    ]
  };

  constructor(private fleetService: FleetService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    try {
      // Load dashboard statistics
      await this.loadStats();
      
      // Load vehicle statuses
      await this.loadVehicles();
      
      // Load recent activities
      await this.loadRecentActivities();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadStats(): Promise<void> {
    // Mock data - replace with actual API calls
    this.stats = {
      totalVehicles: 25,
      totalDrivers: 18,
      activeRoutes: 12,
      maintenanceDue: 3,
      fuelConsumption: 2456.78,
      totalMileage: 125478
    };
  }

  private async loadVehicles(): Promise<void> {
    // Mock data - replace with actual API calls
    this.vehicles = [
      {
        id: 'V001',
        licensePlate: 'ABC-123',
        driver: 'John Smith',
        status: 'active',
        location: 'Downtown Route',
        fuelLevel: 85
      },
      {
        id: 'V002',
        licensePlate: 'XYZ-456',
        driver: 'Jane Doe',
        status: 'maintenance',
        location: 'Service Center',
        fuelLevel: 45
      },
      {
        id: 'V003',
        licensePlate: 'DEF-789',
        driver: 'Mike Johnson',
        status: 'active',
        location: 'Highway 101',
        fuelLevel: 92
      }
    ];
  }

  private async loadRecentActivities(): Promise<void> {
    // Mock data - replace with actual API calls
    this.recentActivities = [
      {
        id: 1,
        type: 'route_completed',
        message: 'John Smith completed Route #RT001',
        timestamp: new Date(Date.now() - 30000),
        icon: 'check_circle',
        color: 'success'
      },
      {
        id: 2,
        type: 'maintenance_scheduled',
        message: 'Vehicle ABC-123 scheduled for maintenance',
        timestamp: new Date(Date.now() - 300000),
        icon: 'build',
        color: 'warning'
      },
      {
        id: 3,
        type: 'driver_checkin',
        message: 'Jane Doe checked in for duty',
        timestamp: new Date(Date.now() - 600000),
        icon: 'person',
        color: 'info'
      }
    ];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warn';
      case 'idle': return 'accent';
      default: return 'primary';
    }
  }

  getFuelLevelColor(level: number): string {
    if (level > 70) return 'success';
    if (level > 30) return 'warn';
    return 'warn';
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  refreshData(): void {
    this.isLoading = true;
    this.loadDashboardData();
  }
}