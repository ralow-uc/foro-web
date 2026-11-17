# foro-web · CuboClub

Frontend del caso **Sistema de Foros en Línea**: **CuboClub**, un foro de
speedcubing y puzzles de giro. Hecho en **Angular 22** con **Bootstrap 5.3**.

**Asignatura:** Desarrollo Full Stack III (DSY2205) · Experiencia 2, Semana 5
· Actividad sumativa *Desarrollando nuestro proyecto bajo lineamientos empresariales*.

> **Funciona sin backend, como pide la actividad esta semana.** Toda la
> información vive en variables de Angular: arreglos semilla
> (`src/app/core/data`) cargados en repositorios con `signal<T[]>`. Los datos
> imitan a los de Oracle de los microservicios (`foro-usuarios`, `foro-temas`,
> `foro-moderacion`). **Al recargar la página todo vuelve a los datos de
> ejemplo y se cierra la sesión**, así que para cambiar de usuario usa
> *Cerrar sesión* en el menú, no el botón de recargar.

---

## 1. Stack

| | Versión |
|---|---|
| Angular (standalone, signals, control flow `@if/@for`, Reactive Forms) | 22.2 |
| Bootstrap (CSS + `bootstrap.bundle.min.js`) · Bootstrap Icons | 5.3.9 · 1.13 |
| TypeScript (modo estricto) | 6.0 |
| Pruebas | Vitest 5 (runner por defecto de Angular) |
| Node.js | 24 (Angular 22 exige ≥ 22.22) |
| Servidor en Docker | nginx (alpine) |

Diseño propio: logo y todas las ilustraciones son SVG hechos para el proyecto
(cubo isométrico, iconos de categorías); tipografías *Bricolage Grotesque* y
*Atkinson Hyperlegible*; paleta inspirada en las pegatinas de un cubo.

## 2. Ejecutar

```bash
nvm use 24
npm ci
npm start                       # http://localhost:4200
npx ng test --watch=false       # 84 pruebas
npx ng build                    # dist/foro-web/browser
```

Con Docker:

```bash
docker build -t foro-web .
docker run -p 8090:80 foro-web  # http://localhost:8090
```

El despliegue junto a los microservicios (Play with Docker) está en
[`../foro-despliegue`](../foro-despliegue).

## 3. Cuentas de demostración

Todas usan la contraseña **`Cubo12345*`**. Se ingresa con el **correo**.

| Correo | Rol | Para qué sirve en la demo |
|---|---|---|
| `admin@foro.cl` | ADMIN | Todo, más administración y levantar baneos |
| `moderadora@foro.cl` | MODERADOR + USUARIO | Panel de moderación: reportes, baneos, cerrar temas |
| `feliks@foro.cl` | USUARIO | Publicar, comentar, reportar, perfil |
| `yiheng@foro.cl` | USUARIO | Segundo usuario para probar contenido ajeno |
| `tymon@foro.cl` | USUARIO **inactivo** | El inicio de sesión se rechaza con un mensaje claro |

## 4. Roles y privilegios

| Acción | Visitante | USUARIO | MODERADOR | ADMIN |
|---|:-:|:-:|:-:|:-:|
| Ver categorías, temas, comentarios y normas | ✔ | ✔ | ✔ | ✔ |
| Registrarse, recuperar contraseña | ✔ | — | — | — |
| Publicar temas y comentar | | ✔ | ✔ | ✔ |
| Editar / eliminar **lo propio** | | ✔ | ✔ | ✔ |
| Reportar contenido ajeno citando una norma | | ✔ | ✔ | ✔ |
| Modificar perfil y contraseña, "Mis temas" | | ✔ | ✔ | ✔ |
| Ver contenido baneado (marcado y con motivo) | | | ✔ | ✔ |
| Panel de moderación: banear, descartar reportes, cerrar/reabrir temas | | | ✔ | ✔ |
| **Levantar** un baneo | | | | ✔ |
| Editar o eliminar contenido ajeno | | | eliminar comentarios | ✔ |
| Administrar usuarios (roles, activar/desactivar, eliminar), categorías y normas | | | | ✔ |

Las restricciones se aplican en tres niveles: **guards** de ruta
(`authGuard`, `rolGuard([...])`, `invitadoGuard`), **interfaz** (los botones solo
aparecen a quien puede usarlos) y **facades** (la regla se vuelve a comprobar
aunque alguien fuerce la llamada). Un ADMIN no puede quitarse su propio rol,
desactivarse ni eliminarse.

## 5. Páginas

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Inicio: portada, estadísticas, grilla de categorías, actividad reciente | público |
| `/categorias/:slug` | Temas de la categoría con búsqueda de texto, filtro por autor, orden y paginación | público |
| `/temas/:id` | Detalle con comentarios; comentar, editar/eliminar lo propio, reportar, moderar | público (acciones según rol) |
| `/temas/nuevo` · `/temas/:id/editar` | Publicar / editar tema | con sesión |
| `/mis-temas` | Temas propios (tabla en escritorio, tarjetas en móvil) | con sesión |
| `/normas` | Normas del foro (N1–N6) | público |
| `/login` | **Inicio de sesión** | visitante |
| `/registro` | **Registro de usuarios** | visitante |
| `/recuperar` | **Recuperar contraseña** en 2 pasos (código de 6 dígitos simulado) | visitante |
| `/perfil` | **Modificación de perfil** y cambio de contraseña | con sesión |
| `/moderacion` | Panel: reportes pendientes, baneos activos, historial, temas cerrados | MODERADOR, ADMIN |
| `/admin/usuarios` · `/admin/categorias` · `/admin/normas` | Administración | ADMIN |
| `/acceso-denegado` · `**` | Errores 403 y 404 | público |

## 6. Formularios y validaciones

Cada campo se valida **dos veces**: con atributos HTML (`required`,
`minlength`, `maxlength`, `type="email"`, `pattern`) y con validadores de
Angular (Reactive Forms). Los errores se muestran por campo con
`is-invalid` / `invalid-feedback` de Bootstrap al salir del campo o al intentar
enviar, y el envío se bloquea mientras el formulario sea inválido.

**Contraseña** (`shared/validators/contrasena.validators.ts`), en registro,
recuperación y cambio de contraseña, con lista de requisitos en vivo y medidor
de fortaleza:

1. Entre 8 y 20 caracteres
2. Al menos una mayúscula
3. Al menos una minúscula
4. Al menos un número
5. Al menos un carácter especial
6. Sin espacios
7. No puede contener el nombre de usuario

Además: usuario de 3–30 caracteres `[A-Za-z0-9._-]` y no repetido, correo
válido y no repetido, confirmación igual a la contraseña, edad mínima de 13 años,
aceptar las normas, título 10–200 y contenido 20–4000, comentario 3–2000,
biografía ≤ 280 con contador, motivo de baneo 10–400, código de norma `N1`–`N999`
único, nombre de categoría único sin distinguir tildes.

## 7. Diseño responsivo (grilla de 12 columnas)

| Tamaño | Ancho | Clases usadas |
|---|---|---|
| **Móvil** | < 576 px (probado en 375) | `col-12`, `col-6` (resúmenes), navbar colapsada (también en tablet), tablas convertidas en tarjetas (`d-md-none`, `d-lg-none`), modales a pantalla completa (`modal-fullscreen-sm-down`) |
| **Tablet** | ≥ 768 px (`md`) | `col-sm-6` / `col-md-6` (categorías, tarjetas y formularios en dos columnas), `col-md-3` (resúmenes), tablas desde `d-md-block` en *Mis temas* |
| **Escritorio** | ≥ 992 px (`lg`) y ≥ 1200 px (`xl`) | `col-lg-4` (grilla de categorías), `col-lg-8` + `col-lg-4` (contenido + barra lateral), `col-lg-5` / `col-lg-7` (formulario + listado en administración), `col-xl-6`, tablas `d-lg-block` en moderación y usuarios, navbar expandida desde 1200 px (`navbar-expand-xl`; con el rol ADMIN la barra tiene 5 enlaces y bajo ese ancho se usa el menú colapsable) |

Capturas en los tres tamaños: [`docs/capturas/`](docs/capturas).

## 8. Patrón de diseño

**Facade** sobre **repositorios en memoria**, con servicios **Singleton**
(`providedIn: 'root'`) y estado reactivo **Observer** (signals). Los componentes
solo hablan con cuatro facades (`AutenticacionFacade`, `ForoFacade`,
`ModeracionFacade`, `AdministracionFacade`), que concentran las reglas de
negocio. Explicación y diagrama en
[`docs/patron-de-diseno.md`](docs/patron-de-diseno.md).

```
src/app/
├── core/
│   ├── models/         interfaces (Usuario, Tema, Norma, Sancion…)
│   ├── data/           arreglos semilla (mismos datos que Oracle)
│   ├── repositories/   RepositorioEnMemoria<T> + repositorios concretos
│   ├── facades/        reglas de negocio por área
│   ├── guards/         authGuard, invitadoGuard, rolGuard
│   └── utils/
├── shared/             componentes, validadores, pipes y servicios de interfaz
└── features/           inicio, foro, autenticacion, perfil, moderacion, normas, admin, errores
```

## 9. Pruebas

```bash
npx ng test --watch=false     # 84 pruebas
```

| Archivo | Qué cubre |
|---|---|
| `contrasena.validators.spec.ts` | Cada regla de contraseña, fortaleza y validadores de formulario |
| `repositorio-en-memoria.spec.ts` | CRUD, ids, inmutabilidad y notificación a los `computed` |
| `autenticacion.facade.spec.ts` | Login, cuenta inactiva, registro duplicado, recuperación y perfil |
| `foro.facade.spec.ts` | Visibilidad del contenido baneado y permisos de autor/rol |
| `moderacion.facade.spec.ts` | Reportes, baneo por MODERADOR, levantamiento solo por ADMIN, cierre de temas |
| `administracion.facade.spec.ts` | Roles, activación, auto-protección del ADMIN, categorías y normas |
| `guards.spec.ts` | Redirecciones a `/login` y `/acceso-denegado` |

Además se recorrió la aplicación en Chrome real (los cuatro perfiles, los
formularios y la moderación de punta a punta) sin errores de consola ni
desbordes horizontales en 375, 768 y 1280 px.

## 10. Ramas

**Trunk Based Development**, como los microservicios: `main` siempre
desplegable, ramas cortas `feature/*`, `fix/*`, `docs/*` integradas con
`--no-ff`, CI en cada push (`.github/workflows/ci.yml`) y versiones como
etiquetas (`v1.0.0`). Reglas en [CONTRIBUTING.md](CONTRIBUTING.md).
