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
| Despliegue | Docker + nginx sobre Ubuntu 24.04 LTS (DigitalOcean) |

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
| `npm run build` | Compila la app para producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |

## Docker (local)

El proyecto incluye un `Dockerfile` multi-stage (build con Node + servido con nginx) y un `docker-compose.yml` para levantarlo igual que en producción:

```bash
docker compose up --build
```

La app queda disponible en `http://localhost:8080`. Las variables de entorno de Firebase se toman del archivo `.env` (ver `.env.example`) y se inyectan en tiempo de build.

## Despliegue en producción

El despliegue productivo se realiza sobre un droplet de **DigitalOcean con Ubuntu 24.04 LTS x64**, ejecutando la app contenerizada con Docker detrás de un reverse proxy con HTTPS.

La guía paso a paso está en **[DEPLOY.md](DEPLOY.md)**.

## Cloud Functions

Las funciones de Firebase viven en `src/cloudFunctions/functions/` como un proyecto Node independiente y se despliegan por separado:

```bash
cd src/cloudFunctions/functions
npm install
firebase deploy --only functions
```

## Pruebas

Actualmente el proyecto no cuenta con un framework de pruebas automatizadas configurado.
