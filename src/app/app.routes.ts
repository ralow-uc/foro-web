import { Routes } from '@angular/router';
import { invitadoGuard } from './core/guards';

/** Rutas de la aplicación (componentes cargados en diferido). */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Ingresar · CuboClub',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/autenticacion/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · CuboClub',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/autenticacion/registro/registro').then((m) => m.RegistroComponent),
  },
  {
    path: 'recuperar',
    title: 'Recuperar contraseña · CuboClub',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/autenticacion/recuperar/recuperar').then((m) => m.RecuperarComponent),
  },
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
