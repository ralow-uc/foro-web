import { Routes } from '@angular/router';

/** Rutas de la aplicación (componentes cargados en diferido). */
export const routes: Routes = [
  {
    path: 'acceso-denegado',
    title: 'Acceso denegado · CuboClub',
    loadComponent: () => import('./features/errores/acceso-denegado').then((m) => m.AccesoDenegadoComponent),
  },
  {
    path: '**',
    title: 'Página no encontrada · CuboClub',
    loadComponent: () => import('./features/errores/no-encontrado').then((m) => m.NoEncontradoComponent),
  },
];
