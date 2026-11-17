import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AutenticacionFacade } from '../../../core/facades/autenticacion.facade';
import { ForoFacade, OPCIONES_ORDEN, OrdenTemas } from '../../../core/facades/foro.facade';
import { CampoErrorComponent } from '../../../shared/components/campo-error/campo-error';
import { FilaTemaComponent } from '../../../shared/components/fila-tema/fila-tema';
import { IconoCategoriaComponent } from '../../../shared/components/icono-categoria/icono-categoria';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { NoEncontradoComponent } from '../../errores/no-encontrado';

export const TEMAS_POR_PAGINA = 5;

/** Listado de temas de una categoría: búsqueda de texto, filtro por autor, orden y paginación. */
@Component({
  selector: 'app-categoria',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CampoErrorComponent,
    FilaTemaComponent,
    IconoCategoriaComponent,
    PaginacionComponent,
    NoEncontradoComponent,
  ],
  templateUrl: './categoria.html',
})
export class CategoriaComponent {
  private readonly foro = inject(ForoFacade);
  protected readonly auth = inject(AutenticacionFacade);

  /** Parámetro de ruta :slug */
  readonly slug = input.required<string>();

  protected readonly opcionesOrden = OPCIONES_ORDEN;
  protected readonly pagina = signal(1);

  protected readonly filtros = inject(FormBuilder).nonNullable.group({
    texto: ['', [Validators.maxLength(100)]],
    autorId: [''],
    orden: ['actividad' as OrdenTemas, [Validators.required]],
  });

  private readonly valoresFiltro = toSignal(this.filtros.valueChanges, { initialValue: this.filtros.getRawValue() });

  protected readonly categoria = computed(() => this.foro.categoriaPorSlug(this.slug()) ?? null);
  protected readonly autores = computed(() => {
    const c = this.categoria();
    return c ? this.foro.autoresDeCategoria(c.id) : [];
  });

  protected readonly resultado = computed(() => {
    const c = this.categoria();
    const f = this.valoresFiltro();
    const texto = (f.texto ?? '').length <= 100 ? (f.texto ?? '') : '';
    return this.foro.buscarTemas({
      categoriaId: c?.id ?? -1,
      texto,
      autorId: f.autorId ? Number(f.autorId) : null,
      orden: f.orden ?? 'actividad',
      pagina: this.pagina(),
      porPagina: TEMAS_POR_PAGINA,
    });
  });

  protected readonly hayFiltros = computed(() => {
    const f = this.valoresFiltro();
    return !!f.texto || !!f.autorId;
  });

  constructor() {
    // Al cambiar los filtros o la categoría se vuelve a la primera página.
    effect(() => {
      this.valoresFiltro();
      this.slug();
      this.pagina.set(1);
    });
  }

  protected limpiar(): void {
    this.filtros.reset({ texto: '', autorId: '', orden: this.filtros.controls.orden.value });
  }

  protected cambiarPagina(n: number): void {
    this.pagina.set(n);
    document.getElementById('listado-temas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
