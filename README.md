# Sistema Comisariato Web

Aplicación web de gestión para el comisariato: usuarios, inventario, compras, promociones, empleados, créditos/reclamos y reportes, con dashboards diferenciados por rol.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite, React Router, Tailwind CSS, Radix UI |
| Backend / BaaS | Firebase (Firestore + Authentication) |
| Funciones serverless | Firebase Cloud Functions (Node 24) |
| Reportes | jsPDF, xlsx (exportación Excel/PDF) |
| Gráficas | Recharts |
| Entorno de desarrollo | Firebase Emulator Suite en Docker (VM local Ubuntu 24.04) |
| Pruebas | Vitest + Testing Library |
| Documentación de API | OpenAPI 3 + Swagger UI (`/api-docs`) |
| CI/CD | GitHub Actions |
| Despliegue | Docker + nginx + Caddy sobre Ubuntu 24.04 LTS (DigitalOcean) |

## Estructura del proyecto

```
src/
├── assets/         # Imágenes y recursos estáticos
├── auth/           # Lógica de autenticación y control de acceso por rol
├── cloudFunctions/ # Firebase Cloud Functions (proyecto independiente)
├── components/     # Componentes reutilizables (Sidebar, Loading, etc.)
├── firebase/        # Inicialización del SDK de Firebase
├── helpers/        # Utilidades
├── hooks/          # Hooks personalizados (p. ej. useInactividad)
├── layouts/        # Layouts de página
├── pages/
│   ├── Authentication/  # Login, perfil
│   ├── Dashboards/      # Dashboards por rol
│   └── Manage/          # Módulos de gestión (Compras, Promociones, Usuarios...)
├── routes/          # Definición de rutas (AppRouter)
└── services/         # Acceso a datos (Firestore) por entidad
```

## Requisitos

- Node.js 24.x
- npm

## Configuración local

1. Clona el repositorio e instala dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de variables de entorno y complétalo con la configuración de tu proyecto de Firebase (Consola de Firebase → Configuración del proyecto → General):

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

3. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Vite (HMR) |
| `npm run build` | Compila la app para producción en `dist/` y publica Swagger UI en `dist/api-docs/` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |
| `npm test` | Ejecuta las pruebas (Vitest) una vez |
| `npm run test:watch` | Pruebas en modo interactivo |
| `npm run test:coverage` | Pruebas + reporte de cobertura (`coverage/`) |

## Entornos: desarrollo y producción

Dos entornos en **máquinas distintas**, con backends independientes:

| | Desarrollo | Producción |
|---|---|---|
| Dónde corre | VM local (VirtualBox, Ubuntu 24.04) | Droplet de DigitalOcean (Ubuntu 24.04) |
| Rama de Git | `develop` | `main` |
| Backend | **Firebase Emulator Suite** (Firestore, Auth, Storage y Functions) en un contenedor, con datos de prueba | Firebase real: proyecto `comisariato-plataform` |
| Contenedores | `crediflow-dev` + `crediflow-dev-emulators` | `crediflow-prod` |
| Compose | `docker-compose.dev.yml` | `docker-compose.yml` |
| Acceso | http://localhost:8081 (Emulator UI: http://localhost:4000) | https://crediflow.duckdns.org |
| Variables | Ninguna: van fijas en el compose | `.env` con las credenciales de Firebase |
| Despliegue | Manual: `bash deploy-dev.sh` | Automático con GitHub Actions al hacer push a `main` |

El **Dockerfile de la app es el mismo** en ambos; solo cambian las variables `VITE_*` que recibe. Con `VITE_USE_EMULATORS=true` (solo lo define el compose de desarrollo) `src/firebase/firebase.js` conecta Firestore, Auth y Storage a los emuladores.

### Usuarios de prueba (desarrollo)

Contraseña de todos: `Crediflow2026*`. Los datos se siembran en cada arranque del contenedor de emuladores (`docker/seed.mjs`) y se pierden al reiniciarlo: el entorno vuelve siempre a un estado limpio.

| Usuario | Rol |
|---|---|
| `todologo@crediflow.test` | Acceso total |
| `admin@crediflow.test` | ADMINISTRADOR |
| `acreditador@crediflow.test` | ACREDITADOR |
| `analista@crediflow.test` | ANALISTA |
| `inventario@crediflow.test` | GESTOR DE INVENTARIO |
| `moderador@crediflow.test` | MODERADOR |
| `proveedor@crediflow.test` | PROVEEDOR |

## Docker (local)

```bash
# Desarrollo: web en http://localhost:8081 + emuladores (UI en http://localhost:4000)
docker compose -f docker-compose.dev.yml up -d --build

# Producción (necesita .env con las credenciales de Firebase) -> http://localhost:8080
docker compose up -d --build
```

Comprobación de salud: `/healthz`. Documentación de la API: `/api-docs`.

Para programar con `npm run dev` contra los emuladores, levanta solo estos y crea un `.env.local` (ignorado por Git):

```bash
docker compose -f docker-compose.dev.yml up -d emulators
```

```env
VITE_USE_EMULATORS=true
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=demo-crediflow
VITE_FIREBASE_STORAGE_BUCKET=demo-crediflow.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=0
VITE_FIREBASE_APP_ID=1:0:web:demo
```

> `enviarCorreoBienvenida` usa EmailJS desde el navegador: en desarrollo enviará correos reales si creas empleados con un correo verdadero.

## Documentación de la API

CrediFlow usa Firebase como backend, así que su "API" es el contrato de datos de Firestore (colecciones, campos, roles) más las Cloud Functions. Está descrito en [docs/openapi.yaml](docs/openapi.yaml) y se publica con **Swagger UI** en `/api-docs` de cada entorno (se genera con `npm run build`).

## Flujo de trabajo y despliegue

```
tu PC ──git push──▶ develop ──(en la VM: bash deploy-dev.sh)──▶ pruebas en http://localhost:8081
                       │
                       └──Pull Request──▶ main ──(GitHub Actions)──▶ https://crediflow.duckdns.org
```

- Push/PR a `main` o `develop` → **CI** (lint, pruebas, build, imagen Docker).
- Push a `main` con CI en verde → despliega a **producción** por SSH al droplet.
- Desarrollo: GitHub no puede alcanzar la VM local, así que se actualiza a mano con `bash deploy-dev.sh` (acepta otra rama como argumento para probarla antes de fusionarla).

La guía paso a paso (crear la VM, el droplet, dominio, HTTPS y secretos) está en **[DEPLOY.md](DEPLOY.md)**.

## Cloud Functions

Las funciones de Firebase viven en `src/cloudFunctions/functions/` como un proyecto Node independiente y se despliegan por separado:

```bash
cd src/cloudFunctions/functions
npm install
firebase deploy --only functions
```

## Pruebas

Las pruebas usan **Vitest** con **Testing Library** (entorno `jsdom`) y viven junto al código (`*.test.js` / `*.test.jsx`). Firestore y Firebase Auth se simulan con `vi.mock`, así que no se conectan a ningún proyecto real.

```bash
npm test                # una pasada
npm run test:watch      # modo interactivo
npm run test:coverage   # con cobertura (coverage/)
```

Cubren: utilidades de fechas (`helpers/`), los servicios de productos, créditos y configuración (`services/`), el hook de inactividad (`hooks/`), la conexión a Firebase/emuladores (`firebase/`) y el componente `Loading`. Se ejecutan automáticamente en cada push y PR mediante GitHub Actions.
