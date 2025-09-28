const firebaseConfig = {
    apiKey: "AIzaSyCWvz4V-zBNAjOOPmqdBjdQlUTY1LIGnsk",
    authDomain: "fleetmanagerpro-31c36.firebaseapp.com",
    projectId: "fleetmanagerpro-31c36",
    storageBucket: "fleetmanagerpro-31c36.appspot.com",
    messagingSenderId: "855420387222",
    appId: "1:855420387222:web:0024156eb6354ddac9e7b7",
    measurementId: "G-5LEGRBK597"
};

export const environment = {
    production: false,
    apiUrl: 'https://localhost:7001/api', // Update with your API URL
    appName: 'Fleet Manager Pro'
};

// src/environments/environment.prod.ts
export const environment = {
    production: true,
    apiUrl: 'https://your-production-api.com/api', // Update with your production API URL
    appName: 'Fleet Manager Pro'
};