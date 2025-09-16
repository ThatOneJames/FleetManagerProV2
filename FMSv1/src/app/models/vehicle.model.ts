export interface Vehicle {
  id: string;
  categoryId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuelCapacity: number;
  currentMileage: number;
  status: 'active' | 'maintenance' | 'inactive' | 'on-route' | 'retired';
  currentDriverId?: string;
  currentLocationLat?: number;
  currentLocationLng?: number;
  lastLocationUpdated?: Date;
  fuelLevel: number;
  registrationExpiry: Date;
  insuranceExpiry: Date;
  insurancePolicy: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleCategory {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  vehicleId?: string;
  driverId?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'optimized';
  totalDistance: number;
  estimatedDuration: number;
  fuelEstimate: number;
  startTime?: Date;
  endTime?: Date;
  actualDuration?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  stops: RouteStop[];
}

export interface RouteStop {
  id: number;
  routeId: string;
  stopOrder: number;
  address: string;
  latitude?: number;
  longitude?: number;
  estimatedArrival?: Date;
  actualArrival?: Date;
  estimatedDeparture?: Date;
  actualDeparture?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'current' | 'completed' | 'skipped';
  notes?: string;
  contactName?: string;
  contactPhone?: string;
}