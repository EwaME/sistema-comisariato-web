# Guía de despliegue — DigitalOcean (Ubuntu 24.04 LTS x64)

Despliegue de **Sistema Comisariato Web** contenerizado con Docker sobre un droplet de DigitalOcean, con nginx sirviendo el build estático y un reverse proxy (Caddy) manejando el dominio y el certificado HTTPS.

```
Internet ── HTTPS (443) ──▶ Caddy (host)
                                │  proxy_pass
                                ▼
                        Contenedor Docker
                        nginx :80 → dist/ (React build)
                                │
                                ▼
                        Firebase (Firestore / Auth)
```

## Requisitos previos

- Droplet de DigitalOcean: **Ubuntu 24.04 LTS x64** (mínimo 1 vCPU / 1 GB RAM alcanza para servir estáticos)
- Un dominio o subdominio apuntando a la IP del droplet (registro `A`)
- Acceso SSH al droplet
- Proyecto de Firebase ya creado, con Firestore y Authentication habilitados

---

## 1. Preparar el servidor

Conéctate por SSH y actualiza el sistema:

```bash
ssh root@<IP_DEL_DROPLET>
apt update && apt upgrade -y
```

Crea un usuario sin privilegios de root para operar (recomendado en vez de usar `root` directamente):

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### Firewall (ufw)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. Instalar Docker Engine

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
```

Verifica la instalación:

```bash
docker --version
docker compose version
```

---

## 3. Clonar el proyecto

```bash
sudo apt install -y git
git clone https://github.com/EwaME/sistema-comisariato-web.git
cd sistema-comisariato-web
```

---

## 4. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Completa con los datos del proyecto de Firebase (Consola de Firebase → Configuración del proyecto):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> Estos valores quedan incrustados en el bundle estático al compilar (así funciona cualquier SDK web de Firebase). Lo importante es que la seguridad de los datos la da Firestore Security Rules, no la privacidad de estas claves.

---

## 5. Build y levantar el contenedor

```bash
docker compose up -d --build
```

Verifica que quedó arriba y respondiendo en el puerto interno:

```bash
docker compose ps
curl -I http://localhost:8080
```

En este punto la app ya sirve en `http://<IP_DEL_DROPLET>:8080`, pero falta el dominio + HTTPS.

---

## 6. Reverse proxy con HTTPS (Caddy)

Caddy obtiene y renueva certificados de Let's Encrypt automáticamente, sin configuración manual de certbot.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Edita `/etc/caddy/Caddyfile`:

```
tu-dominio.com {
    reverse_proxy localhost:8080
}
```

Reinicia Caddy:

```bash
sudo systemctl reload caddy
```

Listo: `https://tu-dominio.com` ya sirve la app con certificado válido y renovación automática.

---

## 7. Actualizar la aplicación (redeploy)

```bash
cd ~/sistema-comisariato-web
git pull
docker compose up -d --build
```

Docker reconstruye solo lo necesario gracias al cacheo de capas (`npm ci` no se repite si `package.json` no cambió).

---

## 8. Logs y mantenimiento

```bash
# Logs en vivo del contenedor
docker compose logs -f

# Reiniciar el contenedor
docker compose restart

# Liberar espacio de imágenes/capas viejas
docker system prune -f
```

## 9. Cloud Functions

Las Firebase Cloud Functions (`src/cloudFunctions/functions/`) **no** corren dentro de este contenedor: son serverless y se despliegan aparte con `firebase deploy --only functions` desde cualquier máquina con el Firebase CLI autenticado (no requieren el droplet).

---

## Checklist de seguridad

- [ ] `ufw` habilitado, solo puertos 22/80/443 abiertos
- [ ] Acceso SSH por llave pública (deshabilitar login por password)
- [ ] Usuario no-root para operar el servidor
- [ ] `.env` con permisos restringidos y fuera del control de versiones
- [ ] Firestore Security Rules revisadas (la protección real de los datos vive ahí, no en el cliente)
