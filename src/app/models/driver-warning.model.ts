export interface DriverWarning {
    id: string;
    driverId: string;
    reason: string;
    issuedBy: string;
    dateIssued: Date | string;
    category?: string;
}
