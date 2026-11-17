import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacionFacade } from '../../../core/facades/autenticacion.facade';
import { AvatarComponent } from '../avatar/avatar';
import { BadgeRolComponent } from '../badge-rol/badge-rol';
import { LogoComponent } from '../logo/logo';
import { obtenerBootstrap } from '../../services/bootstrap';
import { NotificacionService } from '../../services/notificacion.service';

/** Barra de navegación colapsable (Bootstrap navbar-expand-lg) con menú según rol. */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, LogoComponent, AvatarComponent, BadgeRolComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  protected readonly auth = inject(AutenticacionFacade);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  /** En móvil, cierra el menú colapsable al navegar. */
  protected cerrarMenu(): void {
    const el = this.menu()?.nativeElement;
    if (el?.classList.contains('show')) obtenerBootstrap()?.Collapse.getOrCreateInstance(el).hide();
  }

  protected cerrarSesion(): void {
    this.cerrarMenu();
    this.auth.cerrarSesion();
    this.notificaciones.info('Cerraste sesión. ¡Vuelve pronto!', 'Hasta luego', 4000);
    void this.router.navigateByUrl('/');
  }
}
