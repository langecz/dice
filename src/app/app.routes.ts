import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/main-page/main-page.component').then(m => m.MainPageComponent),
    children: [
      {
        path: 'setup',
        loadComponent: () =>
          import('./components/setup/game-config/game-config.component').then(
            m => m.GameConfigComponent,
          ),
      },
      {
        path: 'ordering',
        loadComponent: () =>
          import('./components/setup/player-ordering/player-ordering.component').then(
            m => m.PlayerOrderingComponent,
          ),
      },
      {
        path: 'management',
        loadComponent: () =>
          import('./components/setup/player-management/player-management.component').then(
            m => m.PlayerManagementComponent,
          ),
      },
      {
        path: 'game',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      { path: '', redirectTo: 'setup', pathMatch: 'full' },
    ],
  },
];
