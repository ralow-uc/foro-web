# Patrón de diseño del frontend

**Facade sobre Repositorios en memoria**, con servicios **Singleton** y estado
reactivo con **Observer** (signals de Angular).

## El problema

Esta semana el frontend funciona **sin backend**: los datos viven en arreglos
dentro de la aplicación. Si cada componente leyera y modificara esos arreglos
directamente, las reglas del negocio (quién puede editar, qué contenido baneado
se oculta, que solo un ADMIN levante un baneo…) quedarían repartidas en las
plantillas, duplicadas y fáciles de saltarse. Y cuando el frontend se conecte a
los microservicios habría que reescribir todos los componentes.

## La solución

```
  Componentes (features/*)                ← solo muestran y capturan datos
        │  inyectan solo facades
        ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ Facades (core/facades)              patrón FACADE            │
  │  AutenticacionFacade  ForoFacade  ModeracionFacade           │
  │  AdministracionFacade        (+ MapeadorVistas)              │
  │  · reglas de negocio y permisos por rol                      │
  │  · devuelven Resultado<T> (ok / error) en vez de lanzar      │
  │  · exponen computed() reactivos           patrón OBSERVER    │
  └──────────────────────────┬───────────────────────────────────┘
                             │
  ┌──────────────────────────▼───────────────────────────────────┐
  │ Repositorios (core/repositories)    patrón REPOSITORY        │
  │  RepositorioEnMemoria<T>  → signal<T[]> + CRUD + id autoinc. │
  │  UsuarioRepositorio, TemaRepositorio, NormaRepositorio, …    │
  │  @Injectable({ providedIn: 'root' })  patrón SINGLETON       │
  └──────────────────────────┬───────────────────────────────────┘
                             │ se cargan una vez con
  core/data/*.semilla.ts  ───┘ (arreglos con los mismos datos que Oracle)
```

| Patrón | Dónde | Qué aporta |
|---|---|---|
| **Facade** | `core/facades/*.facade.ts` | Una puerta de entrada por área del negocio. Los componentes no conocen los repositorios. |
| **Repository** | `core/repositories/repositorio-en-memoria.ts` | CRUD genérico sobre un arreglo; cambiarlo por un cliente HTTP no toca facades ni componentes. |
| **Singleton** | `providedIn: 'root'` en repositorios, facades y servicios | Una sola instancia: todos ven el mismo estado (la sesión, los temas…). |
| **Observer** | `signal`, `computed`, plantillas | Al crear, editar o banear algo, cada vista que lo usa se actualiza sola. |

## Ejemplo: banear un tema

1. La moderadora pulsa **Banear** en el detalle del tema. El componente abre
   el modal (`AccionModeracionService`) y no decide nada más.
2. El modal valida el formulario (HTML + Angular) y llama a
   `ModeracionFacade.banear(...)`.
3. El facade verifica la regla: rol MODERADOR o ADMIN, norma vigente, motivo
   de 10 a 400 caracteres, que no exista un baneo activo. Crea la sanción en
   `SancionRepositorio` y marca como sancionados los reportes pendientes.
4. `SancionRepositorio` actualiza su `signal`. Por **Observer**,
   `ForoFacade.temasVisibles` se recalcula: el tema desaparece para los
   usuarios y la moderadora lo ve marcado como "Baneado".

Es el mismo flujo que hace el backend real (`foro-moderacion` →
`foro-temas`), pero en memoria.

## Reglas para mantener el patrón

- Un componente **nunca** inyecta un repositorio (lo revisa la plantilla de PR).
- Las reglas de negocio van en los facades y se prueban ahí
  (`*.facade.spec.ts`), sin levantar componentes.
- Los facades devuelven `Resultado<T>`: el componente solo decide cómo mostrar
  el éxito o el error.
