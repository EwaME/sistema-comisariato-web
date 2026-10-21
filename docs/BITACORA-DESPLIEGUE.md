# Bitácora del despliegue de CrediFlow (Lab 1)

Registro completo de la sesión de despliegue: qué se pidió, qué se decidió, qué falló, cómo se corrigió y qué quedó funcionando. Sirve como historial del trabajo y como referencia rápida para levantar cada pieza del sistema.

Documentos relacionados: **[DEPLOY.md](../DEPLOY.md)** (guía paso a paso limpia, sin la narrativa de errores), **[README.md](../README.md)** (visión general del proyecto) y **[LECCIONES-DESPLIEGUE-GENERICAS.md](LECCIONES-DESPLIEGUE-GENERICAS.md)** (los mismos errores de infraestructura de esta bitácora, pero sin nada específico de CrediFlow — reusable en cualquier otro proyecto con esta pila).

---

## 1. Punto de partida y objetivo

El curso entregó un **stack de referencia** (Python 3.12 + FastAPI + PostgreSQL + SQLAlchemy + JWT + Swagger UI + Pytest + Docker) como guía de lo que debía verse en cualquier proyecto desplegado: backend, base de datos, documentación de API, pruebas automatizadas, control de versiones y contenedores. CrediFlow (Sistema Comisariato Web) es React 19 + Vite + Firebase, así que ese stack se tomó como referencia conceptual, no como receta literal: cada fila se cubrió con su equivalente real dentro del proyecto.

**Requisitos del entregable:**
- Desplegar la aplicación en una máquina virtual, en un **entorno limpio**.
- El entorno de **producción** debía ser **distinto** al de **desarrollo**.
- Entregable completo: app desplegada + documentación + pruebas automatizadas + CI/CD.

El repositorio ya tenía, antes de esta sesión, un `Dockerfile` multi-stage, `nginx.conf`, `docker-compose.yml` y un `DEPLOY.md` (guía escrita como referencia general de DigitalOcean). No existían: pruebas, CI/CD, documentación de API, separación real dev/prod, ni nada desplegado.

---

## 2. Decisiones tomadas (y por qué)

| Pregunta | Decisión | Razón |
|---|---|---|
| ¿Cómo cubrir el stack de referencia (FastAPI/Postgres) con React/Firebase? | Mapear cada pieza a su equivalente real (ver tabla más abajo) | El profe aclaró que el stack es de referencia; lo importante es que el proyecto quede completo con lo que ya usa |
| ¿Dónde va producción? | Droplet de DigitalOcean (Ubuntu 24.04) | Pedido explícito del usuario, cuenta ya existía |
| ¿Dónde va desarrollo? | Máquina virtual **local** (VirtualBox, Ubuntu Server 24.04) | El usuario pidió una VM distinta a la de producción, no un segundo droplet pagado |
| ¿Backend de datos para desarrollo? | **Firebase Emulator Suite** en un contenedor, con datos de prueba sembrados | Alternativa planteada por el usuario en vez de crear un segundo proyecto Firebase en la nube o migrar a Supabase; evita costo y mantiene el mismo modelo de datos que producción |
| ¿Dominio y HTTPS? | **DuckDNS** (gratis) + **Caddy** (certificados Let's Encrypt automáticos) | El usuario preguntó por ngrok; se descartó (ver §4.1) a favor de una URL fija real |
| ¿Cómo se documenta el "backend" para cumplir la fila de OpenAPI/Swagger? | `docs/openapi.yaml` describiendo las colecciones de Firestore y la Cloud Function, servido con Swagger UI en `/api-docs` | Firestore expone una API REST real; documentarla como contrato de datos es honesto y cumple el requisito |
| ¿Contraseña hardcodeada en `reportesService.js`? | Se deja tal cual, a pedido explícito del usuario | Solo protege el acceso a la pantalla de reportes; el usuario la consideró aceptable |
| ¿Despliegue de desarrollo automático (CI/CD) como producción? | **No** — manual con `deploy-dev.sh` | GitHub Actions no puede alcanzar una VM local; solo producción (droplet con IP pública) se automatizó |

### Equivalencias del stack de referencia

| Referencia del curso | Equivalente real en CrediFlow |
|---|---|
| Backend Python 3.12 + FastAPI | Firebase Cloud Functions (Node 24) + capa `src/services/*` |
| Base de datos PostgreSQL | Firebase Firestore (NoSQL) — o el Emulator Suite en desarrollo |
| ORM SQLAlchemy | SDK de Firestore encapsulado por entidad en `src/services/` |
| Autenticación JWT | Firebase Authentication (los ID tokens **son** JWT) |
| Documentación OpenAPI / Swagger UI | `docs/openapi.yaml` + Swagger UI en `/api-docs` |
| Pruebas Pytest | Vitest + Testing Library |
| Git + GitHub | Repositorio `EwaME/sistema-comisariato-web`, ramas `main` (prod) y `develop` (dev) |
| Docker + Docker Compose | `Dockerfile`, `docker-compose.yml` (prod), `docker-compose.dev.yml` (dev) |
| Despliegue de demostración | Droplet DigitalOcean (prod) + VM VirtualBox (dev) |

---

## 3. Arquitectura final

```
                    DESARROLLO (VM local VirtualBox)                     PRODUCCIÓN (DigitalOcean)

 tu PC ── localhost:8081 ──▶ contenedor crediflow-dev                 Internet ─ HTTPS :443 ─▶ Caddy (host)
        └ localhost:4000 ─▶ contenedor crediflow-dev-emulators                                     │
                             (Firestore · Auth · Storage · Functions)                        127.0.0.1:8080
                             datos de prueba, se reinician limpios                                  │
                                                                                          contenedor crediflow-prod
                                                                                          nginx + build de React
                                                                                                    │
                                                                                          Firebase (nube)
                                                                                          proyecto comisariato-plataform
```

Lo que hace a los dos entornos **realmente distintos**: máquina, rama de Git, backend (emulador local vs. Firebase real), datos y usuarios. El `Dockerfile` de la app es el mismo en ambos; solo cambian las variables `VITE_*` inyectadas al compilar.

---

## 4. Cronología: qué se hizo, qué falló y cómo se resolvió

### 4.1 Planificación inicial

Se exploró el repo (`Dockerfile`, `docker-compose.yml`, `nginx.conf`, `firebase.json`, `src/services/`, `src/cloudFunctions/`) para entender qué ya existía. Con eso se armó un plan en 8 fases (limpieza, entornos Firebase, pruebas, OpenAPI, Docker, droplet, DNS/HTTPS, CI/CD, documentación) y se presentó para aprobación antes de tocar código.

**Primer diseño (luego revisado):** dos proyectos de Firebase en la nube (`comisariato-plataform` y `comisariato-plataform-dev`). El usuario preguntó si en vez de eso podía usar una VM local con Docker para desarrollo, similar a como se levanta Supabase local, sin depender de un segundo proyecto en la nube. Se evaluaron tres opciones (Firebase Emulator Suite, segundo proyecto Firebase, Supabase) y se eligió el **Emulator Suite** por ser gratis, no requerir mantenimiento en la nube y no obligar a reescribir el acceso a datos.

**Sobre ngrok:** el usuario preguntó si servía para exponer el droplet con una URL. Se descartó: ngrok es un túnel que necesita un proceso corriendo y en el plan gratuito antepone una pantalla de advertencia; el droplet ya tiene IP pública, así que bastaba con un dominio DNS apuntándole (DuckDNS) más HTTPS real (Caddy + Let's Encrypt).

### 4.2 Limpieza del repo (Fase 0)

- Se eliminaron `vercel.json` y `.firebase/hosting.*.cache` (residuos de otro despliegue), y se quitó `@vercel/speed-insights` de `package.json` y de `src/main.jsx` (sí estaba en uso, inyectando telemetría de Vercel que no aplica fuera de esa plataforma).
- Se añadieron `.firebase/` y `coverage` al `.gitignore`.

### 4.3 Pruebas automatizadas (Vitest)

Se instalaron `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, y se configuró el bloque `test` en `vite.config.js` (entorno jsdom, cobertura v8).

Se escribieron pruebas para: `src/helpers/timestampToDate.js`, `src/services/productosService.js`, `src/services/creditosService.js`, `src/services/configuracionesService.js`, `src/hooks/useInactividad.js`, `src/components/Loading.jsx` y (tras añadir el Emulator Suite) `src/firebase/firebase.js`.

**Verificación de que las pruebas detectan fallos de verdad:** se introdujo deliberadamente un bug en `creditosService.js` (cambiar `pagadas < totalCuotas` por `pagadas <= totalCuotas`, y luego cambiar la fórmula de saldo pendiente) y se confirmó que la suite lo detectaba (`AssertionError: expected 1500 to be 1300`) antes de revertirlo. Sin este paso, una suite que siempre pasa no demuestra nada.

Resultado final: **56 pruebas**, todas en verde.

**Lint:** se encontraron 32 errores de ESLint **preexistentes** en el repo (variables sin usar, `try/catch` innecesarios, etc.), confirmados comparando `git stash` (sin los cambios de esta sesión) contra el estado actual — el conteo era idéntico. No se corrigieron por estar fuera del alcance del despliegue; en el pipeline de CI el paso de lint quedó marcado `continue-on-error: true` con una nota explicando por qué.

### 4.4 Documentación de API (OpenAPI + Swagger UI)

Se generó `docs/openapi.yaml` (OpenAPI 3.0) describiendo las 14+ colecciones de Firestore usadas en `src/services/*` (esquemas, campos, tipos) más el contrato REST que expone Firestore, la autenticación Bearer (ID tokens de Firebase) y la Cloud Function `descontarStockAlAprobar` como trigger documentado. El archivo se generó con un script Node (`gen-openapi.cjs`, en el scratchpad de la sesión) para mantener consistencia entre 23 esquemas y 32 rutas, y se validó con `swagger-cli validate`.

Se creó `scripts/build-api-docs.mjs`, que tras `vite build` copia `swagger-ui-dist` y el YAML a `dist/api-docs/`, generando un `index.html` con Swagger UI apuntando a `./openapi.yaml`. Se añadió a `nginx.conf` un bloque `location /api-docs/` sin caché agresivo.

Se verificó visualmente con una captura headless que Swagger UI carga y lista las rutas dentro del contenedor real.

### 4.5 Docker: separación de entornos (primer diseño, luego revisado)

Diseño inicial: `docker-compose.yml` (prod, puerto 8080) y `docker-compose.dev.yml` (dev, puerto 8081), ambos contra proyectos Firebase reales distintos. Se probaron localmente con Docker Desktop, healthchecks en `/healthz`, y se confirmó con `docker ps` que ambos contenedores quedaban `healthy`.

Este diseño se **reemplazó** en la fase siguiente al decidir usar el Emulator Suite en vez de un segundo proyecto Firebase (ver §4.6).

### 4.6 Migración a Firebase Emulator Suite para desarrollo

Se construyó:
- `firebase.json` con la configuración de los emuladores (Firestore, Auth, Storage, Functions, UI) en modo `singleProjectMode`.
- `Dockerfile.emulators`: imagen `node:24-trixie-slim` + Java (requerido por Firestore/Storage emulados) + `firebase-tools`, con los binarios de los emuladores pre-descargados en el build para no depender de la red al arrancar.
- `docker/emulators-entrypoint.sh`: arranca `firebase emulators:start`, espera a que Firestore y Auth respondan, ejecuta el sembrado de datos y marca un healthcheck (`/tmp/emulators-ready`).
- `docker/seed.mjs`: siembra roles, departamentos, cargos, categorías, productos, configuración global, plazos, garantías, 7 usuarios de prueba (uno por rol, contraseña común) y algunos créditos/reclamos/sugerencias de ejemplo, usando `firebase-admin` contra los emuladores.
- `docker-compose.dev.yml` reescrito: dos servicios, `emulators` (puertos 4000 UI, 8082 Firestore, 9099 Auth, 9199 Storage) y `web` (puerto 8081), con `depends_on: condition: service_healthy`.
- `src/firebase/firebase.js` modificado para conectar Firestore, Auth (ambas instancias, incluida `authSecundaria`) y Storage a los emuladores cuando `VITE_USE_EMULATORS=true`, usando el propio host de la página (para que funcione igual en `localhost` o en la IP de una VM).

**Verificación real, no solo "se ve bien":**
- Se levantaron ambos contenedores (`docker compose -f docker-compose.dev.yml up -d --build`); Firestore, Auth, Storage y el runtime de Functions arrancaron y el seed corrió (`[seed] listo: 7 roles, 7 usuarios..., 4 productos`).
- Se probó login vía REST del emulador de Auth (`identitytoolkit.googleapis.com` local) con credenciales correctas e incorrectas.
- Se aprobó un crédito de prueba vía la API REST de Firestore del emulador y se confirmó en los logs que la Cloud Function `descontarStockAlAprobar` se disparó y descontó el stock del producto correcto (`stock 25 → 23`, `cantidadVendida 0 → 2`).
- Se hizo una prueba end-to-end con un navegador headless (Puppeteer contra Edge): login real contra la app en `http://localhost:8081`, redirección al dashboard, sin errores de consola y sin llamadas a servicios de Google/Firebase reales (solo Google Fonts).
- Se confirmó que el bundle de **producción** no contiene ninguna referencia a los puertos del emulador (`grep -c "9099" dist/assets/*.js` → 0), es decir, producción no puede apuntar al emulador por accidente.

Se revirtieron los cambios ya no vigentes del diseño anterior: se quitó el job `deploy-dev` de GitHub Actions (no aplica a una VM local), se restauraron `.firebaserc` y `.env.example` a un solo proyecto Firebase (producción), y se actualizó `docs/openapi.yaml` para listar el emulador local como servidor alternativo de "desarrollo".

Se creó `deploy-dev.sh`: script que en la VM hace `git fetch` + `git reset --hard` sobre la rama indicada (por defecto `develop`), reconstruye ambos contenedores y espera a que estén `healthy` antes de imprimir las URLs y usuarios de prueba.

### 4.7 CI/CD (GitHub Actions)

Se creó `.github/workflows/ci-cd.yml` con dos jobs:
- **`ci`**: en push/PR a `main` o `develop` — `npm ci`, lint (informativo), `npm run test:coverage`, `npm run build`, verifica que Swagger UI quedó en `dist/api-docs/`, construye la imagen Docker y sube el reporte de cobertura como artifact.
- **`deploy-prod`**: solo en push a `main` con `ci` en verde — se conecta por SSH al droplet (`appleboy/ssh-action`) y ejecuta `git reset --hard origin/main` + `docker compose up -d --build`, esperando el healthcheck.

**Error 1 — `Unexpected input(s) 'script_stop'`:** la opción `script_stop: true` que se usó inicialmente ya no existe en `appleboy/ssh-action@v1`. Se corrigió reemplazándola por `set -e` al inicio del script remoto.

**Error 2 — `missing server host` / secretos no vistos por el workflow:** el primer despliegue automático falló porque los secretos `DO_HOST`, `DO_USER`, `DO_SSH_KEY` todavía no existían (el droplet no se había creado). Se añadió un paso previo (`Verificar secretos del despliegue`) que revisa las tres variables y falla con un mensaje explícito (`Faltan secretos del repositorio: ...`) en vez del error críptico de la acción de SSH. Más adelante, cuando el usuario creó los secretos pero **con la llave SSH personal (pública)** en vez de una dedicada, se le explicó la diferencia entre llave pública/privada y se generó una llave nueva exclusiva (`crediflow_deploy`) para el pipeline, autorizada en el droplet.

Tras crear el droplet, autorizar la llave y cargar los tres secretos, el primer deploy automático real terminó en verde (`Successful in 7s`), junto con el resto del pipeline de CI.

### 4.8 Documentación (`DEPLOY.md`, `README.md`, `Lab 1 Tabla.docx`)

Se reescribieron por completo `DEPLOY.md` y la sección de entornos de `README.md` para reflejar el modelo final (droplet + VM local + emuladores), incluyendo el checklist de seguridad.

Para `docs/Lab 1 Tabla.docx` (tabla Desarrollo/Producción del curso) se automatizó la edición del XML interno del `.docx` (desempaquetado, reescritura de `word/document.xml`, reempaquetado) porque el archivo original venía de Word con formato de tabla no trivial. Se hizo en dos iteraciones:
- **Primera iteración:** reflejaba el diseño con dos proyectos Firebase en la nube (antes de la decisión del Emulator Suite).
- **Bug encontrado en la primera edición del script:** un `re.sub` con reemplazo por posición (`r"\1"`) se corrompió por un problema de escapado de barras invertidas en el heredoc de shell, y terminó insertando un carácter de control (`\x01`) en vez del texto capturado, borrando los nombres de los proyectos Firebase en varias celdas de la tabla. Se detectó **antes de guardar el archivo final** revisando el conteo de apariciones de las cadenas esperadas (`comisariato-plataform-dev` pasó de 1 a 0 tras el reemplazo) y se corrigió reescribiendo la función con `lambda m: ...` en vez de un patrón de reemplazo con backslash.
- **Segunda iteración:** se regeneró la tabla completa reflejando el modelo final (VM local + Emulator Suite), verificando de nuevo que no quedaran caracteres de control y validando la integridad del `.docx` con las herramientas de la skill de `docx` (`validate.py`, comparación de conteo de párrafos contra el original).
- Antes de sobrescribir el archivo real del proyecto, ambas veces se generó un PDF de vista previa (vía Word/COM) y se revisaron las imágenes de cada página para confirmar visualmente el resultado antes de guardar sobre `docs/Lab 1 Tabla.docx`. El `.docx` original quedó respaldado fuera del repo.

### 4.9 Despliegue real: droplet de DigitalOcean

Guía paso a paso ejecutada en vivo con el usuario, con estos incidentes:

- **Selección de plan equivocada:** el usuario tenía preseleccionado el droplet de $24/mes (4 GB); se corrigió a $12/mes (2 GB / 1 vCPU / 50 GB), suficiente para el build con el swap añadido después.
- **Confusión "Private-only":** en una captura, el droplet recién creado mostraba únicamente una IP privada y la etiqueta "Private-only", lo que se diagnosticó (con base en documentación de DigitalOcean) como un droplet sin interfaz pública, sugiriendo destruirlo y recrearlo marcando "Public IPv4 address". **Diagnóstico incorrecto**: el usuario aclaró que la página aún estaba cargando; unos segundos después apareció la IP pública normalmente. No hubo que destruir nada — lección: verificar el estado real (refrescar) antes de recomendar una acción destructiva.
- **`apt: command not found`:** al pegar el primer comando en la sesión SSH, el terminal insertó un código de escape de "bracketed paste" (`^[[200~`) delante del comando, rompiéndolo. Se resolvió tecleando los comandos manualmente en vez de pegarlos, y más adelante desactivando el bracketed paste con `set enable-bracketed-paste off` en `~/.inputrc`.
- **`404 Not Found` en `apt upgrade`:** el usuario ejecutó `apt upgrade` sin haber corrido `apt update` antes, así que el sistema intentó bajar paquetes con versiones ya desactualizadas en el índice local. Se corrigió ejecutando `apt update` primero y repitiendo `apt upgrade -y`.
- **Prompt de configuración de `sshd_config`:** al actualizarse `openssh-server`, apareció el diálogo de `dpkg` preguntando qué hacer con el archivo de configuración modificado por DigitalOcean; se instruyó mantener **"keep the local version currently installed"** para no arriesgar el acceso SSH ya configurado.
- Se creó el usuario `deploy` sin privilegios de root, se copiaron las llaves autorizadas, y se **verificó desde una sesión aparte** que `deploy` entraba con llave antes de endurecer SSH (deshabilitar `PasswordAuthentication` y `PermitRootLogin`) — para evitar quedar fuera del servidor si algo fallaba.
- **Duplicado menor:** el usuario ejecutó dos veces el comando que añade la línea de swap a `/etc/fstab`, dejando la entrada duplicada (sin efecto funcional, pero desprolijo). Se limpió con un `awk` que elimina duplicados exactos.
- Instalación de Docker Engine, `.env` de producción enviado por `scp` desde la PC (evitando teclear credenciales a mano), build y arranque de `docker compose up -d --build`: exitoso a la primera, contenedor `healthy`, `/healthz` → `ok`.

### 4.10 DNS y HTTPS (DuckDNS + Caddy)

- **Error de reCAPTCHA en DuckDNS:** al intentar añadir el subdominio, DuckDNS rechazó el formulario (`reCaptcha failed`), atribuido a la VPN/extensiones activas del navegador del usuario. Se resolvió desactivando la VPN y reintentando.
- **IP incorrecta autodetectada:** DuckDNS propuso automáticamente la IP de la red doméstica del usuario (la misma con la que se conecta por SSH) en vez de la IP pública del droplet. Se corrigió escribiendo manualmente `147.182.182.60` en el campo "current ip" antes de "update ip", y confirmando con `nslookup` desde la PC que el dominio resolvía a la IP del droplet.
- Instalación de Caddy y `Caddyfile` con `reverse_proxy 127.0.0.1:8080`; el certificado de Let's Encrypt se emitió automáticamente al recargar el servicio. `curl -I https://crediflow.duckdns.org` respondió `200`.
- Se recordó (paso que suele olvidarse y rompe el login si se omite) añadir el dominio a **Firebase Authentication → Authorized domains**.

### 4.11 Máquina virtual de desarrollo (VirtualBox)

- El usuario avisó que tenía solo 30 minutos disponibles; se priorizó la ruta manual más corta en vez de automatizar la creación de la VM por script (se había preparado un script con `VBoxManage createvm`/`storageattach`/etc., pero el usuario prefirió explícitamente hacerlo a mano paso a paso, y esa preferencia se respetó de inmediato).
- **Instalación desatendida no planeada:** al crear la VM, el usuario no marcó "Skip Unattended Installation", así que VirtualBox ejecutó su propio instalador automático de Ubuntu con credenciales por defecto del asistente (no `dev`/contraseña elegida como se había planeado), y **sin OpenSSH preinstalado** (la plantilla desatendida de VirtualBox no lo incluye). Se detectó a partir de una captura de la consola mostrando `curtin install` en progreso sin haber pasado por las pantallas del instalador manual.
- Corrección: se dejó terminar la instalación desatendida (no se abortó a medio camino), y una vez con el prompt de login disponible, se instaló `openssh-server` manualmente (`sudo apt install -y openssh-server`) y se ajustaron los comandos siguientes al usuario real de esa VM (`vboxuser`) y al nombre real de la VM (`crediflow-desarrollo`, con guion, distinto del `crediflow-dev` planeado en la documentación).
- Redirección de puertos NAT (`natpf1`) para SSH (2222→22), la app (8081) y los 4 puertos de los emuladores (4000, 8082, 9099, 9199), todos atados a `127.0.0.1` del host.
- Instalación de Docker Engine dentro de la VM (mismos comandos que en el droplet) y `docker run --rm hello-world` exitoso.
- `git clone -b develop ...` + `bash deploy-dev.sh`: build de ambas imágenes (~4.4 min) y arranque con ambos contenedores `Healthy`; el script imprimió las URLs y usuarios de prueba tal como estaba diseñado.
- **Error `400 Bad Request — Request Header Or Cookie Too Large` al abrir `http://localhost:8081` en Firefox:** diagnosticado como acumulación de cookies del navegador para el host `localhost` (compartidas entre todos los puertos de proyectos locales usados antes en esa máquina, no solo el 8081), no un problema de la app ni de nginx. Solución: usar `http://127.0.0.1:8081` (otro origen, otro almacén de cookies) o limpiar las cookies de `localhost` en el navegador.

---

## 5. Qué se logró (estado final verificado)

- ✅ **Producción** corriendo en un droplet de DigitalOcean, con HTTPS válido (Let's Encrypt vía Caddy) en `https://crediflow.duckdns.org`, firewall (`ufw`) restringido a 22/80/443, SSH solo por llave sin acceso de `root`, y usuario `deploy` sin privilegios de superusuario para operar.
- ✅ **Desarrollo** corriendo en una VM local de VirtualBox (Ubuntu Server 24.04), con Firebase Emulator Suite (Firestore, Auth, Storage, Functions) y datos de prueba sembrados automáticamente; completamente aislado de los datos reales de producción.
- ✅ **CI/CD**: GitHub Actions ejecuta lint + 56 pruebas + build en cada push/PR, y despliega automáticamente a producción en cada push a `main` que pase esas verificaciones.
- ✅ **Documentación de API**: `docs/openapi.yaml` + Swagger UI navegable en `/api-docs` de ambos entornos.
- ✅ **Pruebas automatizadas**: 56 pruebas con Vitest + Testing Library, con cobertura configurada, y verificadas contra bugs introducidos deliberadamente (no solo "pasan en verde").
- ✅ Documentación actualizada: `README.md`, `DEPLOY.md`, `docs/openapi.yaml`, `docs/Lab 1 Tabla.docx` y esta bitácora.

## 6. Lo que quedó pendiente / a criterio del usuario

- **Firestore Security Rules**: el repositorio no versiona un `firestore.rules`. Es lo que realmente protege los datos (el cliente usa una API key pública); se recomendó revisarlas en la consola de Firebase y versionarlas, pero no se hizo en esta sesión.
- **Contraseña maestra hardcodeada** en `src/services/reportesService.js` (`Admin2026*`): dejada intencionalmente a pedido del usuario. Solo protege el acceso a la pantalla de reportes del panel admin.
- **Lint**: 32 errores preexistentes de ESLint no corregidos (fuera de alcance de este trabajo); el CI los reporta pero no bloquea el pipeline por ellos (`continue-on-error: true`).
- **Nombres de la VM/usuario de desarrollo distintos de la documentación**: `DEPLOY.md` describe una VM llamada `crediflow-dev` con usuario `dev`; la VM real quedó como `crediflow-desarrollo` con usuario `vboxuser` por la instalación desatendida accidental. Funcionalmente no afecta, pero conviene tenerlo presente al leer la guía.

---

## 7. Cómo levantar cada cosa — referencia rápida de comandos

### 7.1 En tu PC (local, sin Docker) — solo para programar con Vite

```bash
npm install
npm run dev          # servidor de desarrollo Vite, http://localhost:5173
npm run build        # build de producción + Swagger UI en dist/api-docs
npm run preview      # sirve el build localmente
npm run lint         # ESLint
npm test             # pruebas (una pasada)
npm run test:watch   # pruebas en modo interactivo
npm run test:coverage
```

### 7.2 Entorno de PRODUCCIÓN — local con Docker (tu PC, sin tocar el droplet)

Requiere un `.env` en la raíz del proyecto con las credenciales del proyecto Firebase de producción (ver `.env.example`).

```bash
docker compose up -d --build       # construye y levanta -> http://localhost:8080
docker compose ps                  # ver estado
curl http://127.0.0.1:8080/healthz # debe responder "ok"
docker compose logs -f             # logs en vivo
docker compose down                # detener y eliminar el contenedor
```

### 7.3 Entorno de PRODUCCIÓN — droplet de DigitalOcean

```bash
ssh deploy@147.182.182.60                 # entrar al servidor

cd ~/crediflow-prod
docker compose ps                         # estado (debe decir "healthy")
docker compose logs -f                    # logs en vivo
docker compose restart                    # reiniciar el contenedor

# Redeploy manual (lo mismo que hace el pipeline de CI/CD)
git pull
docker compose up -d --build

# Rollback a un commit anterior
git log --oneline -5
git reset --hard <sha>
docker compose up -d --build

sudo ufw status                           # firewall: solo 22, 80, 443
sudo systemctl status caddy               # estado del reverse proxy / HTTPS
sudo journalctl -u caddy -n 50 --no-pager # logs de Caddy
```

El despliegue normal a producción es **automático**: basta con hacer push (o fusionar un PR) a la rama `main`; GitHub Actions corre CI y, si pasa, se conecta por SSH y ejecuta lo mismo de arriba.

### 7.4 Entorno de DESARROLLO — VM local de VirtualBox

**Encender la VM y entrar:**
```powershell
# En tu PC, con la VM ya iniciada en VirtualBox (o iniciarla desde la GUI)
ssh -p 2222 vboxuser@127.0.0.1
```

Si la redirección de puertos se hubiera perdido (VM recreada), volver a crearla con la VM encendida:
```powershell
$vb = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
$vm = "crediflow-desarrollo"
& $vb controlvm $vm natpf1 "ssh,tcp,127.0.0.1,2222,,22"
& $vb controlvm $vm natpf1 "web,tcp,127.0.0.1,8081,,8081"
& $vb controlvm $vm natpf1 "emuui,tcp,127.0.0.1,4000,,4000"
& $vb controlvm $vm natpf1 "firestore,tcp,127.0.0.1,8082,,8082"
& $vb controlvm $vm natpf1 "auth,tcp,127.0.0.1,9099,,9099"
& $vb controlvm $vm natpf1 "storage,tcp,127.0.0.1,9199,,9199"
```

**Dentro de la VM, levantar/actualizar el entorno:**
```bash
cd ~/crediflow-dev
bash deploy-dev.sh              # actualiza a origin/develop, reconstruye y espera a que esté "healthy"
bash deploy-dev.sh mi-rama       # para probar otra rama antes de fusionarla a develop

docker ps                        # crediflow-dev y crediflow-dev-emulators deben decir "healthy"
docker logs -f crediflow-dev-emulators
docker restart crediflow-dev-emulators   # vuelve a sembrar datos limpios sin reconstruir
```

**Desde tu PC (navegador), con la VM corriendo:**
```
http://127.0.0.1:8081            # la aplicación (usar 127.0.0.1, no localhost, si da error de cookies)
http://127.0.0.1:8081/api-docs   # Swagger UI
http://127.0.0.1:4000            # Emulator UI (ver/editar Firestore, Auth, logs de Functions)
```

Usuarios de prueba (contraseña única: `Crediflow2026*`):

| Usuario | Rol |
|---|---|
| `todologo@crediflow.test` | Acceso total |
| `admin@crediflow.test` | ADMINISTRADOR |
| `acreditador@crediflow.test` | ACREDITADOR |
| `analista@crediflow.test` | ANALISTA |
| `inventario@crediflow.test` | GESTOR DE INVENTARIO |
| `moderador@crediflow.test` | MODERADOR |
| `proveedor@crediflow.test` | PROVEEDOR |

### 7.5 Cloud Functions (ninguno de los dos entornos las despliega automáticamente en la nube)

```bash
cd src/cloudFunctions
firebase deploy --only functions --project prod   # a comisariato-plataform
```
En desarrollo no hace falta desplegar nada: la misma función corre dentro del contenedor `crediflow-dev-emulators`.

### 7.6 CI/CD (GitHub Actions)

No se "levanta" manualmente; se dispara solo:
- Cualquier push o PR a `main`/`develop` → corre el job `ci` (lint, pruebas, build, build de imagen Docker).
- Push a `main` con `ci` en verde → corre además `deploy-prod` (despliega al droplet).

Para revisar una corrida: pestaña **Actions** del repositorio en GitHub. Los secretos que ese pipeline necesita (`DO_HOST`, `DO_USER`, `DO_SSH_KEY`) se configuran en *Settings → Secrets and variables → Actions*.

### 7.7 Prueba de aislamiento entre entornos (para demostrar que dev y prod son independientes)

1. En **desarrollo** (`http://127.0.0.1:8081`), iniciar sesión y crear un producto o aprobar un crédito.
2. Verificarlo en la Emulator UI (`http://127.0.0.1:4000` → Firestore).
3. Abrir `https://crediflow.duckdns.org` y confirmar que ese dato **no existe** en producción.
