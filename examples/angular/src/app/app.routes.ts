import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home.component';
import { DetailComponent } from './pages/detail.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'detail/:id', component: DetailComponent },
];
