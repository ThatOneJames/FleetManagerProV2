// src/app/models/driver.model.ts

import { User } from './user.model'; // Assuming you have a user model

export interface Driver extends User {
    licenseNumber: string;
    experienceYears: number;
}