// src/app/models/driver.model.ts

import { User } from './user.model';

export interface Driver extends User {
    licenseNumber: string;
    experienceYears: number;
}