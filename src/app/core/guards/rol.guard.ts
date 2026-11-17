import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models';
import { AutenticacionFacade } from '../facades/autenticacion.facade';

/**
 * Guard funcional parametrizable por roles: `rolGuard(['MODERADOR', 'ADMIN'])`.
 * Sin sesión → /login; con sesión pero sin rol → /acceso-denegado.
 */
export function rolGuard(rolesPermitidos: readonly Rol[]): CanActivateFn {
  return (_ruta, estado) => {
    const auth = inject(AutenticacionFacade);
    const router = inject(Router);
    if (!auth.estaAutenticado()) {
      return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
    }
    return auth.tieneAlgunRol(rolesPermitidos) ? true : router.createUrlTree(['/acceso-denegado']);
  };
}
