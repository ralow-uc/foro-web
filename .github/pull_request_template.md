## Qué cambia

<!-- Describe el cambio en una o dos frases. -->

## Por qué

<!-- Requisito, error o mejora que resuelve. -->

## Cómo se probó

- [ ] `npx ng test --watch=false` en verde
- [ ] `npx ng build` sin errores
- [ ] Revisado en móvil (375 px), tablet (768 px) y escritorio (1280 px)
- [ ] Probado con los roles afectados (visitante / USUARIO / MODERADOR / ADMIN)

## Checklist

- [ ] La rama sale de `main` y vive menos de dos días (`feature/*`, `fix/*`, `docs/*`)
- [ ] Los componentes solo dependen de facades, nunca de repositorios
- [ ] Formularios con validación HTML **y** de Angular
