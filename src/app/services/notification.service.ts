import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notification {
    id: number;
    userId: string;
    title: string;
    message: string;
    type: string;
    category: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    isRead: boolean;
    isSent: boolean;
    sendEmail: boolean;
    sendSms: boolean;
    scheduledSendTime?: Date;
    createdAt: Date;
    readAt?: Date;
}

export interface NotificationRule {
    id: string;
    name: string;
    triggerType: string;
    conditionText?: string;
    recipients?: string;
    sendEmail: boolean;
    sendSms: boolean;
    isActive: boolean;
    triggeredCount: number;
    lastTriggered?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly apiUrl = `${environment.apiUrl}/notifications`;
    private readonly rulesApiUrl = `${environment.apiUrl}/notificationrules`;

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private http: HttpClient) {
        this.refreshUnreadCount();
    }

    getNotifications(unreadOnly: boolean = false): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.apiUrl}/all`);
    }

    getUserNotifications(unreadOnly: boolean = false): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.apiUrl}?unreadOnly=${unreadOnly}`);
    }

    createNotification(notification: Partial<Notification>): Observable<Notification> {
        return this.http.post<Notification>(this.apiUrl, notification);
    }

    markAsRead(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/read`, {}).pipe(
            tap(() => this.refreshUnreadCount())
        );
    }

    markAllAsRead(): Observable<any> {
        return this.http.put(`${this.apiUrl}/read-all`, {}).pipe(
            tap(() => this.refreshUnreadCount())
        );
    }

    deleteNotification(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.refreshUnreadCount())
        );
    }

    refreshUnreadCount(): void {
        this.getUserNotifications(true).subscribe(notifications => {
            this.unreadCountSubject.next(notifications.length);
        });
    }

    getRules(): Observable<NotificationRule[]> {
        return this.http.get<NotificationRule[]>(this.rulesApiUrl);
    }

    createRule(rule: Partial<NotificationRule>): Observable<NotificationRule> {
        return this.http.post<NotificationRule>(this.rulesApiUrl, rule);
    }

    updateRule(id: string, rule: Partial<NotificationRule>): Observable<NotificationRule> {
        return this.http.put<NotificationRule>(`${this.rulesApiUrl}/${id}`, rule);
    }

    deleteRule(id: string): Observable<any> {
        return this.http.delete(`${this.rulesApiUrl}/${id}`);
    }
}
