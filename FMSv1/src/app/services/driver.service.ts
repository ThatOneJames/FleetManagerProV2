import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = 'http://localhost:5000/api/drivers';

  constructor(private http: HttpClient) {}

  getAllDrivers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getDriverById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  addDriver(driver: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, driver);
  }

  updateDriver(id: number, driver: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, driver);
  }

  deleteDriver(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
