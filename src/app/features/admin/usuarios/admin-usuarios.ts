import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdministracionFacade, FiltroUsuarios, UsuarioAdministrado } from '../../../core/facades/administracion.facade';
import { ETIQUETA_ROL, ROLES, Rol } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar';
import { ConfirmacionService } from '../../../shared/services/confirmacion.service';
import { NotificacionService } from '../../../shared/services/notificacion.service';
import { NavAdminComponent } from '../nav-admin';

/** Gestión de cuentas: filtrar, cambiar roles, activar/desactivar y eliminar (solo ADMIN). */
@Component({
  selector: 'app-admin-usuarios',
  imports: [ReactiveFormsModule, DatePipe, NgTemplateOutlet, AvatarComponent, NavAdminComponent],
  templateUrl: './admin-usuarios.html',
})
export class AdminUsuariosComponent {
  protected readonly admin = inject(AdministracionFacade);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly roles = ROLES;
  protected readonly etiquetaRol = ETIQUETA_ROL;

  protected readonly filtro = this.fb.group({
    texto: ['', [Validators.maxLength(60)]],
    rol: ['' as Rol | ''],
    estado: ['' as FiltroUsuarios['estado']],
  });
  private readonly valorFiltro = toSignal(this.filtro.valueChanges, { initialValue: this.filtro.getRawValue() });

  /** Observer: la lista se recalcula sola al cambiar el filtro o los datos. */
  protected readonly usuarios = computed(() => this.admin.filtrarUsuarios(this.valorFiltro() as FiltroUsuarios));

  protected limpiar(): void {
    this.filtro.reset({ texto: '', rol: '', estado: '' });
  }

  protected alternarRol(u: UsuarioAdministrado, rol: Rol, evento: Event): void {
    const roles = u.roles.includes(rol) ? u.roles.filter((r) => r !== rol) : [...u.roles, rol];
    const r = this.admin.cambiarRoles(u.id, roles);
    if (r.ok) {
      this.notificaciones.exito(`Roles de @${u.nombreUsuario}: ${roles.map((x) => ETIQUETA_ROL[x]).join(', ')}.`);
    } else {
      // El checkbox vuelve a reflejar el estado real.
      (evento.target as HTMLInputElement).checked = u.roles.includes(rol);
      this.notificaciones.error(r.error);
    }
  }

  protected alternarActivo(u: UsuarioAdministrado, evento: Event): void {
    const r = this.admin.cambiarActivo(u.id, !u.activo);
    if (r.ok) {
      this.notificaciones.exito(u.activo ? `La cuenta @${u.nombreUsuario} fue desactivada.` : `La cuenta @${u.nombreUsuario} fue activada.`);
    } else {
      (evento.target as HTMLInputElement).checked = u.activo;
      this.notificaciones.error(r.error);
    }
  }

  protected async eliminar(u: UsuarioAdministrado): Promise<void> {
    const ok = await this.confirmacion.confirmar({
      titulo: 'Eliminar cuenta',
      mensaje: `Se eliminará la cuenta @${u.nombreUsuario}. Sus ${u.cantidadTemas} temas se conservan como "Usuario eliminado". ¿Continuar?`,
      textoConfirmar: 'Eliminar cuenta',
      variante: 'danger',
    });
    if (!ok) return;
    const r = this.admin.eliminarUsuario(u.id);
    if (r.ok) this.notificaciones.exito(`La cuenta @${u.nombreUsuario} fue eliminada.`);
    else this.notificaciones.error(r.error);
  }
}
