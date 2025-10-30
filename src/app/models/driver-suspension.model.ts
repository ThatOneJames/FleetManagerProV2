export interface DriverSuspension {
    id: string;
    driverId: string;
    reason: string;
    issuedBy: string;
    dateSuspended: Date | string;
    autoSuspended: boolean;
}
