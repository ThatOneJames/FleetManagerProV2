import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { enableProdMode } from '@angular/core';

// Enable production mode if not in development
const isProduction = false; // Set to true for production build
if (isProduction) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => {
    console.error('Error starting FleetManager Pro Angular app:', err);
  });