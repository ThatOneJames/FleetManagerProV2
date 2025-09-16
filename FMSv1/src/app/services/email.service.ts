import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EmailService {
    private apiUrl = 'http://localhost:5000/api/email';

    constructor(private http: HttpClient) { }

    sendEmail(email: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/send`, email);
    }
}
