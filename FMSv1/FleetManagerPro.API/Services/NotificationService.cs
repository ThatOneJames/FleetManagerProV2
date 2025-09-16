import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
providedIn: 'root'
})
export class NotificationService
{
    private apiUrl = 'http://localhost:5000/api/notifications';

  constructor(private http: HttpClient) {}

  getAll() : Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
    }

    markAsRead(id: number) : Observable<any> {
    return this.http.put<any>(`${this.apiUrl
}/${ id}/ read`, { });
  }

  sendNotification(notification: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, notification);
}
}
