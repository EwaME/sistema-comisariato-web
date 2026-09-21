#!/usr/bin/env bash
# Actualiza y reconstruye el entorno de DESARROLLO en la VM local (Ubuntu 24.04).
#
# Uso (desde la carpeta del proyecto en la VM):
#   bash deploy-dev.sh              # despliega la rama develop
#   bash deploy-dev.sh mi-rama      # prueba otra rama en la VM antes de fusionarla
#
# Descarta cualquier cambio local de la VM: el código siempre es el de GitHub.
set -euo pipefail
cd "$(dirname "$0")"

RAMA="${1:-develop}"
COMPOSE="docker compose -f docker-compose.dev.yml"

echo "==> Actualizando código desde GitHub (rama: $RAMA)"
git fetch origin "$RAMA"
git checkout "$RAMA"
git reset --hard "origin/$RAMA"

echo "==> Construyendo y levantando contenedores (web + emuladores de Firebase)"
$COMPOSE up -d --build --remove-orphans

echo "==> Esperando a que estén sanos"
estado() { docker inspect -f '{{.State.Health.Status}}' "$1" 2>/dev/null || echo "starting"; }
for _ in $(seq 1 60); do
    if [ "$(estado crediflow-dev)" = "healthy" ] && [ "$(estado crediflow-dev-emulators)" = "healthy" ]; then
        docker image prune -f >/dev/null
        cat <<'EOF'

Entorno de desarrollo listo.
  Aplicación     http://localhost:8081
  Emulator UI    http://localhost:4000

Usuarios de prueba (contraseña: Crediflow2026*):
  todologo@crediflow.test   acceso total
  admin@crediflow.test      ADMINISTRADOR
  acreditador@crediflow.test | analista@ | inventario@ | moderador@ | proveedor@  (mismo dominio)
EOF
        exit 0
    fi
    sleep 3
done

echo "ERROR: los contenedores no llegaron a estar sanos. Últimos logs:" >&2
$COMPOSE logs --tail 40 >&2
exit 1
