import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionFacade } from '../facades/autenticacion.facade';

/** Exige sesión iniciada. Si no la hay, redirige a /login conservando la URL de retorno. */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AutenticacionFacade);
  const router = inject(Router);
  return auth.estaAutenticado() ? true : router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

/** Para login/registro/recuperar: si ya hay sesión, envía al inicio. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AutenticacionFacade);
  const router = inject(Router);
  return auth.estaAutenticado() ? router.createUrlTree(['/']) : true;
};
