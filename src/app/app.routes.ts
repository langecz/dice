import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'setup',
    loadComponent: () => import('./components/setup/setup.component').then(m => m.SetupComponent)
  },
  {
    path: 'game',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: '',
    redirectTo: 'setup',
    pathMatch: 'full'
  }
];
