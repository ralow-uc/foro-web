# ---------------------------------------------------------------------------
#  Imagen Docker de foro-web (Angular + nginx)
#
#  Etapa 1: compila la aplicación con Node 24 (Angular 22 exige Node >= 22.22).
#  Etapa 2: nginx sirve solo los archivos estáticos generados.
#
#    docker build -t foro-web .
#    docker run -p 8090:80 foro-web        ->  http://localhost:8090
# ---------------------------------------------------------------------------
FROM node:24-alpine AS compilacion
WORKDIR /app

# Dependencias primero: esta capa queda en caché mientras no cambie package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx ng build --configuration production


FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist/foro-web/browser /usr/share/nginx/html
EXPOSE 80
