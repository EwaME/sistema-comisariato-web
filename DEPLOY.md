# Guía de despliegue — CrediFlow

CrediFlow (Sistema Comisariato Web) se ejecuta en **dos entornos, cada uno en su propia máquina**, ambos limpios y contenerizados con Docker:

| | **Desarrollo** | **Producción** |
|---|---|---|
| Máquina | VM local en VirtualBox (Ubuntu Server 24.04) | Droplet de DigitalOcean (Ubuntu 24.04 LTS x64) |
| Rama | `develop` | `main` |
| Backend | Firebase Emulator Suite en un contenedor (datos de prueba) | Firebase real, proyecto `comisariato-plataform` |
| Acceso | http://localhost:8081 (desde tu PC) | https://crediflow.duckdns.org |
| Despliegue | Manual: `bash deploy-dev.sh` | Automático con GitHub Actions al hacer push a `main` |

## Arquitectura

```
                    DESARROLLO (VM local)                                PRODUCCIÓN (DigitalOcean)

 tu PC ── localhost:8081 ──▶ contenedor crediflow-dev                 Internet ─ HTTPS :443 ─▶ Caddy (host)
        └ localhost:4000 ─▶ contenedor crediflow-dev-emulators                                     │
                             (Firestore · Auth · Storage · Functions)                        127.0.0.1:8080
                             datos de prueba, se reinician limpios                                  │
                                                                                          contenedor crediflow-prod
                                                                                          nginx + build de React
                                                                                                    │
                                                                                          Firebase (nube)
                                                                                          comisariato-plataform
```

**Por qué son realmente distintos:** distinta máquina, distinta rama, distinto backend (emulador local vs. Firebase real), distintos datos y usuarios. El `Dockerfile` de la app es el mismo; solo cambian las variables `VITE_*` que recibe al compilar.

### Equivalencia con el stack de referencia del curso

| Referencia | En CrediFlow |
|---|---|
| Backend Python + FastAPI | Firebase Cloud Functions (Node 24) + capa `src/services/` |
| Base de datos PostgreSQL | Cloud Firestore (NoSQL) |
| ORM SQLAlchemy | SDK de Firestore, encapsulado por entidad en `src/services/` |
| Autenticación JWT | Firebase Authentication (el ID token es un JWT) |
| OpenAPI / Swagger UI | `docs/openapi.yaml` servido en **`/api-docs`** |
| Pruebas Pytest | Vitest + Testing Library (`npm test`) |
| Git + GitHub | Repositorio `EwaME/sistema-comisariato-web`, ramas `main` y `develop` |
| Docker + Docker Compose | `Dockerfile`, `Dockerfile.emulators`, `docker-compose.yml` (prod), `docker-compose.dev.yml` (dev) |
| Despliegue de demostración | Droplet de DigitalOcean + GitHub Actions |

## Requisitos previos

- Cuenta de **DigitalOcean** (con método de pago) y de **GitHub**
- Proyecto Firebase de **producción** (`comisariato-plataform`) con plan **Blaze** activo (lo exigen Cloud Functions y Storage)
- En tu PC (Windows): Git, el cliente OpenSSH (viene con Windows 11) y **VirtualBox** para la VM de desarrollo

---

## 1. Ramas de Git (en tu PC, una sola vez)

```bash
git checkout main && git pull
git checkout -b develop
git push -u origin develop
```

Flujo de trabajo:

```
tu PC ──git push──▶ develop ──(en la VM: bash deploy-dev.sh)──▶ pruebas en http://localhost:8081
                       │
                       └──Pull Request──▶ main ──(GitHub Actions)──▶ https://crediflow.duckdns.org
```

---

# PARTE A — Producción (droplet de DigitalOcean)

## 2. Llave SSH (en tu PC, PowerShell)

```powershell
ssh-keygen -t ed25519 -C "crediflow-do"
# Enter a todo (ruta por defecto). Pon una frase de paso si quieres.
type $env:USERPROFILE\.ssh\id_ed25519.pub     # copia esta línea completa
```

## 3. Crear el droplet

En DigitalOcean → **Create → Droplets**:

| Campo | Valor |
|---|---|
| Región | La más cercana (p. ej. NYC1 / NYC3) |
| Imagen | **Ubuntu 24.04 (LTS) x64** |
| Tamaño | Basic → Regular (SSD) → **2 GB RAM / 1 vCPU / 50 GB** (~12 USD/mes) |
| Autenticación | **SSH Key** → *New SSH Key* → pega la llave pública del paso 2 |
| Nombre | `crediflow` |

> **Por qué 2 GB:** compilar el frontend (React 19 + Firebase + Recharts + jsPDF + xlsx) consume mucha memoria. Con 1 GB el build puede terminar en `Killed`. Además añadimos swap en el paso 4.

Anota la **IP pública**. Opcional pero recomendable: *Networking → Reserved IPs* para conservarla si algún día recreas el droplet.

## 4. Preparar el servidor

Conéctate como `root` la primera vez:

```bash
ssh root@<IP_DEL_DROPLET>
apt update && apt upgrade -y
```

### Usuario sin privilegios (`deploy`)

```bash
adduser deploy                       # define una contraseña (se usará para sudo)
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # hereda tu llave SSH
```

### Endurecer SSH

Abre **otra terminal** y comprueba que entras como `deploy` (`ssh deploy@<IP>`) **antes** de continuar. Luego, en el servidor:

```bash
sudo tee /etc/ssh/sshd_config.d/01-hardening.conf >/dev/null <<'EOF'
PasswordAuthentication no
PermitRootLogin no
EOF
sudo sshd -t && sudo systemctl restart ssh
```

> El prefijo `01-` es intencional: sshd usa el **primer** valor que lee, y Ubuntu ya trae `50-cloud-init.conf`.

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

> **No** abras el 8080. Además, `docker-compose.yml` lo publica solo en `127.0.0.1`: Docker manipula `iptables` directamente y **se salta ufw**, así que un `8080:80` sin más quedaría expuesto a Internet aunque ufw lo bloquee.

### Swap de 2 GB (red de seguridad para los builds)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## 5. Instalar Docker Engine

Como usuario `deploy` (`exit` y `ssh deploy@<IP>`). **Estos mismos comandos sirven para la VM de desarrollo (Parte B).**

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permite ejecutar docker sin sudo
sudo usermod -aG docker $USER
newgrp docker

docker --version && docker compose version
```

## 6. Clonar y levantar producción

El repositorio es público, no hace falta autenticarse:

```bash
sudo apt install -y git
git clone -b main https://github.com/EwaME/sistema-comisariato-web.git ~/crediflow-prod
cd ~/crediflow-prod
cp .env.example .env && nano .env && chmod 600 .env
```

Rellena el `.env` con los datos de **producción** (Consola de Firebase → Configuración del proyecto → General → Tus apps → Web):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=comisariato-plataform
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> Estos valores quedan incrustados en el bundle al compilar (así funciona cualquier SDK web de Firebase). La protección de los datos la dan las **Firestore Security Rules**, no el secreto de estas claves.

```bash
docker compose up -d --build            # el primer build tarda unos minutos
docker ps                               # crediflow-prod "Up ... (healthy)"
curl -s http://127.0.0.1:8080/healthz   # ok
```

## 7. Dominio gratis con DuckDNS

1. Entra a <https://www.duckdns.org> con tu cuenta de GitHub.
2. En **domains**, crea `crediflow`.
3. Escribe la **IP del droplet** en *current ip* y pulsa **update ip**.
4. Comprueba desde tu PC: `nslookup crediflow.duckdns.org` → debe devolver la IP del droplet.

## 8. HTTPS con Caddy

Caddy pide y renueva los certificados de Let's Encrypt automáticamente (necesita que el dominio ya apunte al droplet y los puertos 80/443 abiertos).

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Edita `/etc/caddy/Caddyfile` (`sudo nano /etc/caddy/Caddyfile`) y déjalo así:

```
crediflow.duckdns.org {
    reverse_proxy 127.0.0.1:8080
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Prueba <https://crediflow.duckdns.org> (candado válido, emisor Let's Encrypt).

## 9. Autorizar el dominio en Firebase (paso que rompe el login si se olvida)

Firebase Authentication rechaza el inicio de sesión desde dominios no autorizados. En el proyecto **`comisariato-plataform`**:

**Authentication → Settings → Authorized domains → Add domain** → `crediflow.duckdns.org`

Opcional (recomendado): en Google Cloud Console → *APIs y servicios → Credenciales* → tu *Browser key*, restringe por **referentes HTTP** a tu dominio.

## 10. CI/CD hacia producción (GitHub Actions)

El flujo está en [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml):

| Evento | Qué ocurre |
|---|---|
| Push o PR a `main` / `develop` | **CI**: `npm ci` → lint (informativo) → `npm run test:coverage` → `npm run build` → build de la imagen Docker |
| Push a `main` y CI en verde | **Deploy a producción**: SSH al droplet → `git reset --hard origin/main` → `docker compose up -d --build` → espera al *healthcheck* |

### Configurar el acceso SSH del pipeline (una vez)

En tu PC, crea un par de llaves **exclusivo** para GitHub Actions (sin frase de paso):

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\crediflow_deploy -C "github-actions" -N '""'
type $env:USERPROFILE\.ssh\crediflow_deploy.pub
```

Añade la **pública** al droplet, como `deploy`:

```bash
echo "<pega-aquí-la-llave-pública>" >> ~/.ssh/authorized_keys
```

En GitHub → repositorio → **Settings → Secrets and variables → Actions → New repository secret**:

| Secreto | Valor |
|---|---|
| `DO_HOST` | IP pública del droplet |
| `DO_USER` | `deploy` |
| `DO_SSH_KEY` | Contenido **completo** de `crediflow_deploy` (la privada, con las líneas `-----BEGIN…` / `-----END…`) |

Recomendado: en **Settings → Environments** crea `produccion` y activa *Required reviewers* para exigir aprobación manual antes de cada despliegue; y en **Settings → Branches** protege `main` exigiendo que pase el check `ci`.

---

# PARTE B — Desarrollo (VM local con VirtualBox)

El entorno de desarrollo no usa ningún proyecto de Firebase en la nube: un contenedor con el **Firebase Emulator Suite** (Firestore, Authentication, Storage y Cloud Functions) hace de backend, y se siembra con datos de prueba en cada arranque.

## 11. Crear la VM

1. Descarga **Ubuntu Server 24.04 LTS** (ISO) desde <https://ubuntu.com/download/server>.
2. En VirtualBox → **Nueva**:

| Campo | Valor |
|---|---|
| Nombre | `crediflow-dev` |
| ISO | La de Ubuntu Server (marca *Skip Unattended Installation*) |
| Memoria | **4096 MB** |
| Procesadores | **2** |
| Disco | **30 GB** |

3. Inicia la VM e instala Ubuntu Server con las opciones por defecto. Marca **Install OpenSSH server**. Crea el usuario `dev`.
4. Apaga la VM y abre una terminal en tu PC para redirigir puertos (red **NAT**, que aísla la VM de tu red local). Reemplaza la ruta si VirtualBox está en otra:

```powershell
$vb = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
& $vb modifyvm "crediflow-dev" --natpf1 "ssh,tcp,127.0.0.1,2222,,22"
& $vb modifyvm "crediflow-dev" --natpf1 "web,tcp,127.0.0.1,8081,,8081"
& $vb modifyvm "crediflow-dev" --natpf1 "emuui,tcp,127.0.0.1,4000,,4000"
& $vb modifyvm "crediflow-dev" --natpf1 "firestore,tcp,127.0.0.1,8082,,8082"
& $vb modifyvm "crediflow-dev" --natpf1 "auth,tcp,127.0.0.1,9099,,9099"
& $vb modifyvm "crediflow-dev" --natpf1 "storage,tcp,127.0.0.1,9199,,9199"
```

> El navegador de tu PC habla **directamente** con los emuladores (Firestore, Auth y Storage), por eso hay que redirigir también esos puertos, no solo el 8081. Se enlazan a `127.0.0.1`, así que nadie más en tu red puede alcanzarlos.

5. Arranca la VM y entra desde tu PC: `ssh -p 2222 dev@127.0.0.1`.

## 12. Preparar la VM

Dentro de la VM, instala Docker con **exactamente los mismos comandos del paso 5**. Después:

```bash
sudo apt install -y git
git clone -b develop https://github.com/EwaME/sistema-comisariato-web.git ~/crediflow-dev
cd ~/crediflow-dev
bash deploy-dev.sh
```

La primera vez tarda unos minutos (construye la imagen de la app y la de los emuladores, que descarga Firestore, Storage y la UI). Al terminar imprime:

```
Entorno de desarrollo listo.
  Aplicación     http://localhost:8081
  Emulator UI    http://localhost:4000
```

Abre esas direcciones **en el navegador de tu PC** e inicia sesión con un usuario de prueba (contraseña `Crediflow2026*`):

| Usuario | Rol |
|---|---|
| `todologo@crediflow.test` | Acceso total |
| `admin@crediflow.test` | ADMINISTRADOR |
| `acreditador@crediflow.test` | ACREDITADOR |
| `analista@crediflow.test` | ANALISTA |
| `inventario@crediflow.test` | GESTOR DE INVENTARIO |
| `moderador@crediflow.test` | MODERADOR |
| `proveedor@crediflow.test` | PROVEEDOR |

En la **Emulator UI** (puerto 4000) puedes ver y editar los datos, los usuarios de Auth y los logs de la Cloud Function.

## 13. Día a día: probar un cambio en desarrollo

```
1. En tu PC programas y haces commit.
2. git push origin develop
3. Enciendes la VM y entras:   ssh -p 2222 dev@127.0.0.1
4. cd ~/crediflow-dev && bash deploy-dev.sh
5. Pruebas en http://localhost:8081 desde tu PC.
6. Si todo va bien: Pull Request develop → main  →  GitHub Actions despliega a producción.
```

`deploy-dev.sh` hace `git fetch` + `git reset --hard` (la VM siempre queda idéntica a GitHub), reconstruye y espera a que los contenedores estén sanos. Para probar otra rama antes de fusionarla: `bash deploy-dev.sh mi-rama`.

Los datos de prueba se **reinician en cada arranque** del contenedor de emuladores: el entorno vuelve siempre a un estado limpio. Para volver a sembrar sin reconstruir: `docker restart crediflow-dev-emulators`.

> **Correo:** `enviarCorreoBienvenida` usa EmailJS desde el navegador. En desarrollo enviará correos reales si creas un empleado con un correo verdadero; usa correos ficticios.

---

# Verificación y operación

## 14. Verificación final

**Producción** (en el droplet):

```bash
docker ps                              # crediflow-prod: healthy
sudo ufw status                        # solo OpenSSH, 80 y 443
sudo ss -tlnp | grep 8080              # escucha solo en 127.0.0.1
curl -I https://crediflow.duckdns.org  # 200, certificado válido
```

**Desarrollo** (en la VM): `docker ps` → `crediflow-dev` y `crediflow-dev-emulators` en `healthy`.

**Prueba de aislamiento** (la que demuestra que los entornos son distintos):

1. En **desarrollo**, entra con `inventario@crediflow.test` y crea un producto.
2. Aparece en la Emulator UI (http://localhost:4000 → Firestore → `productos`).
3. En la consola de Firebase de `comisariato-plataform` (producción) **no** existe.
4. En desarrollo, aprueba un crédito con `acreditador@crediflow.test` y comprueba en la Emulator UI que el stock del producto baja: la Cloud Function corre en el emulador.

En ambas URLs, `/api-docs` muestra Swagger UI con las colecciones.

## 15. Operación diaria

```bash
# Logs en vivo
docker logs -f crediflow-prod                 # en el droplet
docker logs -f crediflow-dev-emulators        # en la VM

# Estado y salud
docker ps

# Redeploy manual de producción (lo mismo que hace el pipeline)
cd ~/crediflow-prod && git pull && docker compose up -d --build

# Liberar espacio de imágenes/capas viejas
docker image prune -f
```

**Rollback** de producción a una versión anterior:

```bash
cd ~/crediflow-prod
git log --oneline -5                 # elige el commit bueno
git reset --hard <sha> && docker compose up -d --build
```

y después revierte ese cambio en `main` (`git revert`) para que el siguiente deploy automático no lo vuelva a desplegar.

## 16. Cloud Functions

Las Firebase Cloud Functions (`src/cloudFunctions/functions/`) **no** corren en el droplet: son serverless y se despliegan aparte al proyecto de producción (requiere plan Blaze), desde cualquier máquina con Firebase CLI autenticado:

```bash
cd src/cloudFunctions
firebase deploy --only functions --project prod
```

En desarrollo la misma función corre dentro del emulador (contenedor `crediflow-dev-emulators`); no hay que desplegar nada.

La función `descontarStockAlAprobar` descuenta el stock del producto cuando un crédito pasa a `Aprobado`.

---

## Checklist de seguridad

- [ ] `ufw` habilitado en el droplet, solo puertos 22/80/443 abiertos
- [ ] SSH solo por llave pública (`PasswordAuthentication no`, `PermitRootLogin no`)
- [ ] Usuario no-root (`deploy`) para operar el servidor
- [ ] Puerto 8080 ligado a `127.0.0.1` (solo alcanzable vía Caddy)
- [ ] `.env` con permisos `600` y fuera del control de versiones
- [ ] Llave SSH de GitHub Actions dedicada, distinta de tu llave personal
- [ ] VM de desarrollo con red NAT y puertos redirigidos solo a `127.0.0.1` (los emuladores no tienen autenticación)
- [ ] **Firestore Security Rules** revisadas y versionadas: la protección real de los datos vive ahí, no en el cliente. *(El repositorio hoy no incluye un `firestore.rules`; conviene añadirlo y desplegarlo con `firebase deploy --only firestore:rules --project prod`.)*
- [ ] Dominio autorizado en Firebase Auth limitado a `crediflow.duckdns.org`
