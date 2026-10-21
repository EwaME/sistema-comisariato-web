# Lecciones de despliegue — errores comunes y cómo evitarlos

Guía genérica de problemas encontrados al desplegar una app web (Docker + DigitalOcean + VirtualBox + GitHub Actions + DuckDNS/Caddy). No depende de ningún framework ni proveedor de base de datos: aplica a cualquier proyecto con esta misma pila de infraestructura.

Extraída de la bitácora de despliegue de un proyecto concreto — ver ese documento si buscas el detalle línea por línea de ese caso.

---

## 1. Servidor Linux recién creado (droplet, VM, etc.)

### `apt upgrade` falla con `404 Not Found`
**Causa:** se ejecutó `apt upgrade` sin haber corrido `apt update` antes. El sistema intenta bajar paquetes usando un índice local desactualizado, y las URLs ya no existen en el mirror.
**Solución:** siempre en este orden:
```bash
sudo apt update
sudo apt upgrade -y
```

### El terminal SSH rompe el primer comando pegado
**Síntoma:** pegas un comando y sale `command not found`, con basura tipo `^[[200~` al inicio.
**Causa:** el cliente SSH activa "bracketed paste" y el servidor no lo interpreta bien en esa sesión.
**Soluciones:**
- Teclea el primer comando en vez de pegarlo, o pega línea por línea.
- Desactívalo para las próximas sesiones:
  ```bash
  echo 'set enable-bracketed-paste off' >> ~/.inputrc
  ```

### Diálogo de `dpkg` sobre un archivo de configuración modificado
**Cuándo aparece:** al actualizar paquetes como `openssh-server`, si el proveedor de la VM ya tocó ese archivo de configuración.
**Qué elegir:** **"keep the local version currently installed"**, salvo que sepas exactamente qué cambia la versión nueva. La versión local es la que ya te está dejando entrar por SSH; la del mantenedor puede alterar eso.

### Endurecer SSH sin quedar fuera del servidor
Antes de deshabilitar `PasswordAuthentication` o `PermitRootLogin`:
1. Crea el usuario nuevo y copia tu llave pública a su `~/.ssh/authorized_keys`.
2. **Verifica desde una sesión aparte** (sin cerrar la que ya tienes abierta) que ese usuario entra con la llave.
3. Solo entonces aplica el endurecimiento y reinicia el servicio SSH.

Si algo sale mal después de endurecer, la consola web del proveedor (DigitalOcean, etc.) sirve de rescate incluso sin SSH.

### Evitar duplicar líneas en archivos de configuración
Comandos como `echo "..." >> /etc/fstab` (swap, por ejemplo) son **acumulativos**: si los repites por error, quedan líneas duplicadas. No rompe nada de inmediato, pero conviene revisar:
```bash
grep -c "texto_buscado" /etc/archivo   # si es > 1, hay duplicados
```

---

## 2. Nube / paneles de proveedores (DigitalOcean, DuckDNS, etc.)

### Un panel web tarda en reflejar el estado real
Si una página de estado (por ejemplo, la ficha de un droplet recién creado) muestra algo alarmante justo después de crear el recurso —como si le faltara una IP pública—, **refresca antes de asumir que hay un problema y actuar** (y mucho menos antes de borrar y recrear el recurso). Los paneles a veces cargan la información en varias tandas.

### DNS dinámico gratuito (tipo DuckDNS) autodetecta la IP equivocada
**Síntoma:** registras un subdominio y el formulario propone tu IP de casa/oficina (la que usas para conectarte) en vez de la IP del servidor que quieres exponer.
**Solución:** escribe manualmente la IP del servidor en el campo correspondiente antes de guardar, y confírmalo con:
```bash
nslookup tu-subdominio.dominio.com
```
Debe devolver la IP del servidor, no la tuya.

### Formulario rechazado por captcha sin razón aparente
**Causa típica:** una VPN o extensiones de bloqueo activas interfieren con el reCAPTCHA del sitio.
**Solución:** desactiva la VPN/extensiones para ese sitio, o pruébalo en una ventana privada sin extensiones.

---

## 3. Docker y reverse proxy

### Reverse proxy (Caddy, nginx, etc.) con HTTPS automático
- El certificado solo se emite si el DNS **ya** apunta al servidor y los puertos 80/443 están abiertos en el firewall. Verifica el DNS (`nslookup`) antes de recargar el proxy, o vas a gastar reintentos fallidos.
- Publica los puertos internos de la app solo en `127.0.0.1` en el `docker-compose`, y deja que el reverse proxy sea el único punto de entrada:
  ```yaml
  ports:
    - "127.0.0.1:8080:80"
  ```
  Docker manipula `iptables` directamente y **se salta el firewall del sistema** (`ufw`, etc.), así que un `8080:80` sin restringir a `127.0.0.1` queda expuesto a Internet aunque el firewall diga que ese puerto está cerrado.

### Memoria insuficiente al construir la imagen
Si el build de una app grande (muchas dependencias, bundlers pesados) se mata a medio camino en un servidor con poca RAM, añade swap como red de seguridad:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 4. GitHub Actions / CI-CD

### Confundir llave SSH pública y privada
| | Pública | Privada |
|---|---|---|
| Aspecto | `ssh-ed25519 AAAA... comentario` | `-----BEGIN OPENSSH PRIVATE KEY-----` ... |
| Se comparte | Sí — se sube al servidor de destino | Nunca — solo vive en tu máquina y en el secreto de CI |
| Para qué sirve | El servidor la usa para **reconocer** a quien se conecta | El cliente (o el runner de CI) la usa para **demostrar** que es quien dice ser |

Un secreto de despliegue (`DEPLOY_SSH_KEY` o similar) necesita la **privada**. Usa una llave **dedicada** al pipeline, generada sin passphrase (el runner no puede teclearla) y sin frase de paso:
```bash
ssh-keygen -t ed25519 -f ./clave_deploy -N ""
```
Autorízala en el servidor (`cat clave_deploy.pub >> ~/.ssh/authorized_keys` del usuario de despliegue) y pruébala **antes** de pegarla en el secreto:
```bash
ssh -i ./clave_deploy usuario@servidor "echo ok"
```

### El job de despliegue falla con un error críptico si faltan secretos
Antes de que existan los secretos del repositorio (servidor, usuario, llave), cualquier acción de SSH en el workflow falla con mensajes poco claros (`missing server host`, etc.). Conviene anteponer un paso explícito que valide su presencia y falle con un mensaje entendible:
```yaml
- name: Verificar secretos requeridos
  env:
    HOST: ${{ secrets.DEPLOY_HOST }}
    USER: ${{ secrets.DEPLOY_USER }}
    KEY: ${{ secrets.DEPLOY_SSH_KEY }}
  run: |
    faltan=""
    for v in HOST USER KEY; do [ -z "${!v}" ] && faltan="$faltan $v"; done
    if [ -n "$faltan" ]; then
      echo "::error::Faltan secretos:$faltan"
      exit 1
    fi
```

### Opciones de acciones de terceros que cambian entre versiones
Las acciones de la comunidad (ej. las que ejecutan comandos por SSH) a veces eliminan o renombran parámetros entre versiones sin subir la versión mayor del tag (`@v1` puede apuntar a algo distinto con el tiempo). Si el log muestra `Unexpected input(s) '...'`, revisa el README actual de la acción en vez de asumir que tu configuración antigua sigue siendo válida.

---

## 5. Máquinas virtuales locales (VirtualBox, VMware, etc.)

### La instalación "desatendida" se dispara sin avisar
**Síntoma:** creas la VM, la enciendes y el instalador del sistema operativo empieza a correr **solo**, sin mostrar ninguna pantalla de configuración (idioma, usuario, red…).
**Causa:** el asistente de creación de la VM tenía marcada por defecto una opción de instalación automática/desatendida (a veces con nombre parecido a "Skip Unattended Installation" — y hay que marcarla, no dejarla, para evitar el modo automático).
**Consecuencia:** el usuario y la contraseña quedan definidos por el propio asistente (no los que ibas a elegir tú en el instalador), y componentes que sueles marcar a mano durante la instalación (como el servidor SSH) pueden quedar sin instalar.
**Qué hacer si ya pasó:** no interrumpas la instalación a medio camino. Déjala terminar, entra con las credenciales que definiste en el asistente de la VM (revísalas ahí si no las recuerdas) e instala manualmente lo que falte:
```bash
sudo apt install -y openssh-server
```

### Redirección de puertos (NAT) para acceder a la VM desde el host
Con la VM en modo NAT (aislada de tu red local), cada puerto que quieras usar desde tu máquina debe redirigirse explícitamente, y conviene atarlo a `127.0.0.1` para que nadie más en tu red lo alcance:
```bash
VBoxManage controlvm "nombre-vm" natpf1 "etiqueta,tcp,127.0.0.1,puerto_host,,puerto_vm"
```
Recuerda incluir **todos** los puertos que la app necesite exponer, no solo el de la aplicación principal (paneles de administración, bases de datos locales, etc.).

---

## 6. Navegador / cliente

### `400 Bad Request — Request Header Or Cookie Too Large`
**Causa:** las cookies del navegador se guardan por **nombre de host**, sin distinguir el puerto. Si usas `localhost` para muchos proyectos distintos a lo largo del tiempo, todas esas cookies se acumulan en el mismo "cajón" y la cabecera `Cookie` que se envía en cada petición crece hasta que el servidor (nginx, etc.) la rechaza.
**No es un bug de tu app.** Diagnóstico rápido: probar la misma URL en una ventana privada o en otro navegador — si ahí carga bien, es esto.
**Soluciones:**
- Usa `http://127.0.0.1:puerto` en vez de `http://localhost:puerto` (el navegador lo trata como otro origen, con su propio almacén de cookies).
- O limpia las cookies del host `localhost` desde la configuración de privacidad del navegador.

---

## 7. Principio general que resume casi todos estos casos

Antes de tomar una acción que sea difícil de revertir (destruir un recurso en la nube, deshabilitar el acceso por contraseña, forzar un push) **verifica el estado real primero** (refresca, vuelve a consultar, prueba desde una sesión aparte) en vez de actuar sobre el primer síntoma que ves. Varios de los "errores" de esta lista no fueron errores del sistema, sino una lectura apresurada de un estado que todavía no había terminado de cargar o de propagarse.
