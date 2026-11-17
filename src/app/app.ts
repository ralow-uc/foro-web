import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer';
import { ModalConfirmacionComponent } from './shared/components/modal-confirmacion/modal-confirmacion';
import { ModalModeracionComponent } from './shared/components/modal-moderacion/modal-moderacion';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { ToastsComponent } from './shared/components/toasts/toasts';

/** Componente raíz: estructura general (navbar, contenido, pie, toasts y modal global). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastsComponent, ModalConfirmacionComponent, ModalModeracionComponent],
  templateUrl: './app.html',
})
export class App {}
