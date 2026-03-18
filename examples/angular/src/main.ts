import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withViewTransitions } from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
    providers: [
        // Enable View Transitions API - Angular's built-in support!
        provideRouter(routes, withViewTransitions()),
    ],
}).catch((err) => console.error(err));
