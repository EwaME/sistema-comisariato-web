#!/bin/sh
# Arranca el Emulator Suite, siembra los datos de prueba y se queda en primer plano.
# Los datos viven solo en memoria: al reiniciar el contenedor se vuelve a un estado limpio.
set -e

PROJECT="${GCLOUD_PROJECT:-demo-crediflow}"

firebase emulators:start --project "$PROJECT" &
EMU_PID=$!

# Cierra los emuladores limpiamente cuando Docker manda SIGTERM
trap 'kill -TERM "$EMU_PID" 2>/dev/null; wait "$EMU_PID"; exit 0' TERM INT

echo "[emulators] esperando a Firestore y Auth..."
for i in $(seq 1 120); do
    if curl -sf http://127.0.0.1:8082 >/dev/null 2>&1 && curl -sf http://127.0.0.1:9099 >/dev/null 2>&1; then
        break
    fi
    if ! kill -0 "$EMU_PID" 2>/dev/null; then
        echo "[emulators] el emulador terminó antes de estar listo" >&2
        exit 1
    fi
    sleep 1
done

FIRESTORE_EMULATOR_HOST=127.0.0.1:8082 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
node /app/seed.mjs

touch /tmp/emulators-ready
echo "[emulators] listo. UI en :4000"

wait "$EMU_PID"
