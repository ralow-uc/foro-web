import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from './core/guards';

/** Rutas de la aplicación (componentes cargados en diferido). */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'CuboClub · Foro de speedcubing',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.InicioComponent),
  },
  {
    path: 'categorias/:slug',
    title: 'Categoría · CuboClub',
    loadComponent: () => import('./features/foro/categoria/categoria').then((m) => m.CategoriaComponent),
  },
  {
    path: 'temas/nuevo',
    title: 'Nuevo tema · CuboClub',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/foro/formulario-tema/formulario-tema').then((m) => m.FormularioTemaComponent),
  },
  {
    path: 'temas/:id/editar',
    title: 'Editar tema · CuboClub',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/foro/formulario-tema/formulario-tema').then((m) => m.FormularioTemaComponent),
  },
  {
    path: 'temas/:id',
    title: 'Tema · CuboClub',
    loadComponent: () => import('./features/foro/tema-detalle/tema-detalle').then((m) => m.TemaDetalleComponent),
  },
  {
    path: 'mis-temas',
    title: 'Mis temas · CuboClub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/foro/mis-temas/mis-temas').then((m) => m.MisTemasComponent),
  },
  {
    path: 'perfil',
    title: 'Mi perfil · CuboClub',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil').then((m) => m.PerfilComponent),
  },
  {
    path: 'normas',
    title: 'Normas del foro · CuboClub',
    loadComponent: () => import('./features/normas/normas').then((m) => m.NormasComponent),
  },
  {
    path: 'moderacion',
    title: 'Moderación · CuboClub',
    canActivate: [rolGuard(['MODERADOR', 'ADMIN'])],
    loadComponent: () =>
      import('./features/moderacion/panel/panel-moderacion').then((m) => m.PanelModeracionComponent),
  },
  {
    path: 'admin',
    canActivate: [rolGuard(['ADMIN'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      {
        path: 'usuarios',
        title: 'Usuarios · Administración · CuboClub',
        loadComponent: () => import('./features/admin/usuarios/admin-usuarios').then((m) => m.AdminUsuariosComponent),
      },
      {
        path: 'categorias',
        title: 'Categorías · Administración · CuboClub',
        loadComponent: () => import('./features/admin/categorias/admin-categorias').then((m) => m.AdminCategoriasComponent),
      },
      {
        path: 'normas',
        title: 'Normas · Administración · CuboClub',
        loadComponent: () => import('./features/admin/normas/admin-normas').then((m) => m.AdminNormasComponent),
      },
    ],
  },
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
