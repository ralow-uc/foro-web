import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoComponent } from '../logo/logo';
import { obtenerBootstrap } from '../../services/bootstrap';

/** Barra de navegación colapsable (Bootstrap navbar-expand-lg). */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  /** En móvil, cierra el menú colapsable al navegar. */
  protected cerrarMenu(): void {
    const el = this.menu()?.nativeElement;
    if (el?.classList.contains('show')) obtenerBootstrap()?.Collapse.getOrCreateInstance(el).hide();
  }
}
