---

# ENSO CRM — Plataforma de juegos cognitivos

ENSO CRM es una plataforma web para la gestión y análisis de juegos cognitivos, desarrollada como proyecto académico en dos módulos: **Desarrollo Web en Entorno Servidor** y **Despliegue de Aplicaciones Web**.

El sistema combina un CRM completo construido con Laravel 12 con capacidades avanzadas: reconocimiento facial, detección de emociones en tiempo real, chat con WebSockets y despliegue en una Raspberry Pi 5.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Laravel 12, PHP 8.2 |
| Frontend | React 18, TypeScript, Inertia.js |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL |
| API interna | Laravel Sanctum |
| Reconocimiento facial | FastAPI + DeepFace (VGG-Face) |
| WebSockets | Laravel Reverb |
| Contenedores | Docker |
| Mensajería | RabbitMQ 3 |
| Asistencia IA | Claude Code + MCP (GitHub, RabbitMQ) |
| Despliegue | Raspberry Pi 5, Ngrok |

---

## Arquitectura general

El proyecto sigue una arquitectura de servicios desacoplados. Laravel actúa como núcleo central: gestiona usuarios, sesiones, la API y la lógica de negocio. Las responsabilidades especializadas (reconocimiento facial, juegos) se delegan a servicios externos que se comunican con Laravel por HTTP.

```
Navegador  <-->  Laravel (CRM + API)  <-->  Microservicio Python (FastAPI)
                       |
                 PostgreSQL
                       |
              Laravel Reverb (WebSockets)
                       |
                   RabbitMQ  <-->  workers / servicios externos
```

El navegador nunca se comunica directamente con el microservicio Python. Toda decisión de acceso y seguridad la toma Laravel.

Una capa adicional de asistencia inteligente conecta los tres elementos:

```
GitHub  -->  GitHub MCP  -->  Claude Code  -->  Laravel / scripts  -->  RabbitMQ  -->  workers
```

MCP (Model Context Protocol) no es una librería de Laravel ni parte del repositorio: es el protocolo que permite que Claude Code opere sobre el repositorio de forma controlada (leer issues, revisar PRs, sugerir cambios) sin acceso arbitrario.

---

## Sistema de roles

La plataforma implementa tres roles con acceso diferenciado:

- **Admin**: panel de gestión completo, CRUD de usuarios y juegos, acceso al historial de todos los jugadores.
- **Gestor**: puede publicar y despublicar juegos, revisar estadísticas.
- **Player**: accede al catálogo de juegos publicados, juega y consulta su propio historial emocional.

El control de acceso se aplica mediante middleware `CheckRole` en todas las rutas protegidas. Las rutas web (vistas Inertia) y las rutas API (JSON + Sanctum) están separadas en `web.php` y `api.php` respectivamente.

---

## Reconocimiento facial con microservicio Python

El reconocimiento facial se delega completamente a un microservicio independiente escrito en Python con **FastAPI** y **DeepFace**. Laravel no procesa imágenes ni ejecuta modelos de visión artificial: coordina, valida y decide.

### Flujo de verificación

1. El navegador captura un frame de la webcam y lo envía a Laravel (`POST /api/facial/verify`).
2. Laravel recupera la foto registrada del usuario desde el disco privado.
3. Laravel envía ambas imágenes al microservicio vía HTTP multipart.
4. El microservicio compara los rostros con el modelo **VGG-Face** y devuelve `verified`, `distance` y el umbral aplicado.
5. Laravel interpreta la respuesta, inicia sesión si procede y redirige al dashboard correspondiente.

### Configuración del microservicio

El microservicio corre en Docker. El umbral de distancia coseno está configurado en `0.5` (más permisivo que el valor por defecto de DeepFace de `0.68`) para mejorar la tasa de aceptación en condiciones de iluminación variable.

Los pesos del modelo (~580 MB, VGG-Face) se persisten en un volumen Docker llamado `deepface_models` para evitar descargas en cada reinicio del contenedor.

```yaml
# docker-compose.yml (extracto)
volumes:
  deepface_models:

services:
  facial:
    image: facial-service
    volumes:
      - deepface_models:/root/.deepface/weights
    ports:
      - "8181:8181"
```

La red de Docker usa `bip: 10.10.0.1/16` para evitar colisiones con la red local.

### Registro de foto (enroll)

Los usuarios pueden registrar o actualizar su foto facial desde su perfil. La foto se almacena en el disco `private` de Laravel (`storage/app/private/faces/{id}.jpg`) y nunca es accesible públicamente.

---

## Detección de emociones durante el juego

Mientras el jugador juega, la plataforma detecta sus expresiones faciales en tiempo real directamente en el navegador usando **face-api.js**. Esta funcionalidad no identifica personas: observa la interacción para poder analizar cómo se usa cada juego.

### Dónde ocurre la detección

La detección ocurre completamente en el cliente. El navegador accede a la webcam, analiza frames localmente y obtiene probabilidades de expresiones básicas (`neutral`, `happy`, `sad`, `angry`, `surprised`, `fearful`, `disgusted`). Laravel no recibe imágenes ni vídeo, solo datos ya interpretados.

### Frecuencia de muestreo

No se procesa a 30 fps. La detección se ejecuta a intervalos razonables (cada pocos segundos) para no generar ruido ni sobrecargar la API.

### Persistencia en base de datos

Al finalizar la partida, las emociones detectadas se guardan en la tabla `game_emotions` asociadas a la sesión de juego (`user_game_id`). Cada registro almacena la emoción detectada y el timestamp.

El modelo `UserGame` expone la relación:

```php
public function emotions(): HasMany
{
    return $this->hasMany(GameEmotion::class, 'user_game_id');
}
```

---

## Historial de partidas

Los jugadores pueden consultar su historial completo en `/history`. Para cada partida se muestra:

- Nombre del juego
- Fecha y hora de la sesión
- Duración en minutos y segundos
- Número de errores
- **Emoción predominante**: calculada en el backend contando la frecuencia de cada emoción registrada durante la sesión y quedándose con la más repetida.

```php
$primaryEmotion = $entry->emotions
    ->countBy('emotion')
    ->sortDesc()
    ->keys()
    ->first() ?? 'Sin datos';
```

El historial se obtiene filtrando por el usuario autenticado, con eager loading de juego y emociones para evitar el problema N+1:

```php
UserGame::where('user_id', Auth::user()->id)
    ->orderBy('played_at', 'desc')
    ->with(['game', 'emotions'])
    ->get();
```

---

## Chat en tiempo real con WebSockets

La plataforma incluye un chat contextualizado implementado con **Laravel Reverb**, el servidor de WebSockets nativo de Laravel. A diferencia de las peticiones HTTP convencionales, Reverb mantiene una conexión TCP bidireccional abierta entre cliente y servidor, logrando que los mensajes aparezcan instantáneamente sin recargar la página.

El frontend usa **Inertia.js con React**, por lo que no se usa Livewire (ambas tecnologías resuelven el mismo problema con enfoques incompatibles). La integración con Reverb se hace a través del sistema de eventos de Laravel y Laravel Echo en el cliente.

### Configuración necesaria en `.env`

```env
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database
```

Los eventos del chat se procesan mediante jobs en segundo plano (cola de base de datos) para no bloquear las peticiones HTTP y mantener la aplicación responsiva.

### Instalación

```bash
php artisan install:broadcasting
php artisan migrate
php artisan queue:work
php artisan reverb:start
```

---

## Capa de eventos con RabbitMQ

RabbitMQ actúa como broker de mensajería asíncrona: cuando ocurre algo relevante en el sistema (apertura de una sesión de juego, finalización de una validación, publicación de un juego), Laravel publica un evento en una cola en lugar de procesarlo todo de forma síncrona en la misma petición HTTP.

Esto desacopla los procesos pesados del flujo principal y se acerca a la arquitectura de entornos reales.

### Eventos publicados desde Laravel

```json
{
  "event": "game_session.started",
  "user_id": 42,
  "game_id": 7,
  "timestamp": "2025-04-24T10:00:00Z"
}
```

Ese evento puede activar un worker que registre métricas, envíe una notificación o lance una tarea de análisis sin bloquear al jugador.

### Acceso al panel de gestión

Con el contenedor en marcha, el panel de administración de RabbitMQ está disponible en `http://localhost:15672`. Las credenciales por defecto se configuran mediante variables de entorno:

```env
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

> **Importante**: cambia las credenciales antes de desplegar en producción.

### Por qué no se usa `QUEUE_CONNECTION=rabbitmq` directamente

Laravel usa `QUEUE_CONNECTION=database` para sus jobs de broadcasting (Reverb). RabbitMQ se incorpora como capa de eventos de dominio desacoplada, no como sustituto del sistema de colas interno de Laravel. Ambos coexisten con responsabilidades distintas.

---

## Asistencia inteligente con MCP

MCP (Model Context Protocol) es un protocolo estándar que permite que herramientas de IA como Claude Code se conecten a sistemas externos de forma controlada. En este proyecto se conecta con GitHub y con RabbitMQ.

El desarrollador no le pide a la IA explicaciones genéricas: le pide acciones reales sobre el repositorio:

> *"Revisa esta PR y dime si falta validación en la API de sesiones."*
> *"Crea una issue para separar web.php y api.php con un checklist de terminado."*
> *"Comprueba si la cola de eventos está recibiendo mensajes."*

### Configuración del servidor MCP de GitHub

La configuración se declara en `.claude/settings.json` en la raíz del proyecto. Claude Code la carga automáticamente al abrir el directorio.

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    }
  }
}
```

Claude no tiene acceso a GitHub por defecto: se le conecta explícitamente un servidor MCP que le da acceso solo a las operaciones declaradas en `GITHUB_TOOLSETS`. En este proyecto se limita a `repos`, `issues` y `pull_requests` para no dar más permisos de los necesarios.

### Token de GitHub

Genera un Personal Access Token (PAT) en GitHub con permisos mínimos: `repo` (lectura), `issues` y `pull_requests`. Expórtalo como variable de entorno o sustitúyelo directamente en la configuración (no lo commitees):

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxx
```

### Configuración del servidor MCP de RabbitMQ

```json
{
  "mcpServers": {
    "rabbitmq": {
      "command": "uvx",
      "args": ["amq-mcp-server-rabbitmq@latest", "--allow-mutative-tools"]
    }
  }
}
```

Requiere `uv` instalado (`pip install uv`). Con esto, Claude Code puede listar colas, comprobar exchanges y verificar si una cola está recibiendo mensajes, sin necesidad de abrir el panel web.

### Por qué esta configuración y no otra

El servidor oficial de GitHub (`ghcr.io/github/github-mcp-server`) es la opción más sólida: está mantenido por GitHub, tiene imagen pública de Docker y permite limitar el alcance con `GITHUB_TOOLSETS`. Para RabbitMQ no existe un servidor oficial único; `amq-mcp-server-rabbitmq` (Amazon MQ) tiene la documentación más completa y la release más reciente.

---

## Despliegue en Raspberry Pi 5

La aplicación completa está desplegada en una **Raspberry Pi 5** con Docker. El microservicio de reconocimiento facial corre como contenedor junto a Laravel, comunicándose por red interna.

### HTTPS con Ngrok

La webcam del navegador requiere un contexto seguro (HTTPS) para funcionar. En producción se usa **Ngrok** para exponer la Raspberry Pi con un túnel HTTPS público, evitando la necesidad de un certificado SSL propio y permitiendo el acceso desde cualquier dispositivo de la red.

Ngrok se arranca en un proceso separado para que no interfiera con la sesión SSH:

```bash
nohup ngrok http 8000 &
```

La URL pública de Ngrok se configura en `APP_URL` y en los dominios stateful de Sanctum para que las cookies de sesión funcionen correctamente.

### Consideraciones de red

El `docker-compose.yml` usa `bip: 10.10.0.1/16` para aislar la red de Docker de la red local de la Raspberry y evitar que las rutas colisionen, lo que podría cortar la conexión SSH durante el despliegue.

---

## Puesta en marcha local

```bash
# Dependencias PHP
composer install

# Dependencias JS (requiere --legacy-peer-deps por conflicto @types/node vs Vite 7)
npm install --legacy-peer-deps

# Variables de entorno
cp .env.example .env
php artisan key:generate

# Base de datos
php artisan migrate

# Arrancar todos los servicios
php artisan serve
npm run dev
php artisan reverb:start
php artisan queue:work

# Contenedores Docker (facial-api, PostgreSQL, RabbitMQ, Reverb)
docker-compose up -d
```

### Variables de entorno del microservicio y RabbitMQ

```env
FACIAL_SERVICE_URL=http://127.0.0.1:8181/verify
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

### Panel de gestión de RabbitMQ

Una vez levantado Docker, el panel web está en `http://localhost:15672` (usuario/contraseña según `.env`).

---

## Flujo completo con MCP activo

Con Claude Code abierto en el proyecto y el MCP configurado, el flujo de trabajo queda así:

1. El desarrollador abre una rama (`git checkout -b feature/nueva-funcionalidad`)
2. Solicita a Claude Code que revise la PR antes de mergearla
3. Claude lee el diff via GitHub MCP y detecta si falta validación o documentación
4. Al abrirse la PR en GitHub, Laravel puede publicar un evento en RabbitMQ para notificar al equipo o lanzar pruebas automatizadas
5. Claude puede consultar el estado de las colas via el MCP de RabbitMQ

```
PR en GitHub  -->  GitHub MCP  -->  Claude Code  -->  revisión + sugerencias
                                                            |
                                              Laravel publica evento
                                                            |
                                                       RabbitMQ
                                                            |
                                                   worker / notificación
```

---

## Guía completa: RabbitMQ y MCP explicados desde cero

Esta sección explica en profundidad qué son RabbitMQ y MCP, para qué sirven en este proyecto, cómo están integrados y cómo probar que funcionan correctamente. Está pensada para entender el "por qué" detrás de cada decisión técnica.

---

### ¿Qué es RabbitMQ y por qué existe?

RabbitMQ es un **broker de mensajería**: un intermediario que recibe mensajes de un productor y los entrega a uno o varios consumidores. La analogía más clara es una oficina de correos: el remitente deposita una carta, la oficina la guarda, y el destinatario la recoge cuando puede. El remitente no espera a que el destinatario esté disponible.

Sin RabbitMQ (arquitectura síncrona):
```
Usuario hace clic → Laravel procesa TODO → responde al usuario
                    (puede tardar segundos o fallar)
```

Con RabbitMQ (arquitectura asíncrona):
```
Usuario hace clic → Laravel publica evento → responde al usuario (inmediato)
                                   ↓
                             RabbitMQ guarda el mensaje
                                   ↓
                    Worker lo procesa en segundo plano (cuando puede)
```

El beneficio es que el usuario recibe una respuesta rápida y el trabajo pesado (enviar un email, calcular estadísticas, notificar a otros servicios) ocurre después, sin bloquear la experiencia.

---

### Conceptos clave de RabbitMQ

**Cola (Queue)**: almacén de mensajes. Los mensajes se encolan y se entregan en orden (FIFO). En este proyecto la cola se llama `default`.

**Productor**: quien publica mensajes en la cola. En este proyecto es Laravel (a través de los Jobs).

**Consumidor (Worker)**: proceso que escucha la cola y procesa los mensajes. Se arranca con `php artisan queue:work rabbitmq`.

**Exchange**: punto de entrada por el que los productores envían mensajes. El exchange decide a qué colas enrutar el mensaje según reglas. En la configuración básica de este proyecto se usa el exchange por defecto.

**Vhost (Virtual Host)**: espacio de nombres dentro de RabbitMQ, como una base de datos separada. Se usa `/` (el vhost raíz) por defecto.

**Mensaje**: el contenido que viaja por la cola. En este proyecto cada mensaje es un Job serializado de Laravel con el evento de dominio (`game_session.started`, etc.).

**ACK (Acknowledgement)**: confirmación de que un mensaje fue procesado correctamente. Si el worker confirma (ACK), RabbitMQ elimina el mensaje de la cola. Si falla, RabbitMQ puede reencolarlo.

---

### Cómo está integrado RabbitMQ en este proyecto

La integración tiene tres capas:

**1. Infraestructura** — Docker levanta RabbitMQ como contenedor:
```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"   # puerto AMQP (protocolo de mensajería)
    - "15672:15672" # panel web de administración
```

**2. Laravel** — el paquete `vladimir-yuldashev/laravel-queue-rabbitmq` hace que el sistema de colas de Laravel use RabbitMQ como backend en lugar de la base de datos. La conexión se declara en `config/queue.php` y se activa con `QUEUE_CONNECTION=rabbitmq` en `.env`.

**3. Código de aplicación** — tres archivos definen la cadena completa:

```
app/Events/GameSessionStarted.php     ← el hecho que ocurrió
app/Listeners/PublishGameSessionToRabbitMQ.php  ← reacciona al evento
app/Jobs/ProcessDomainEvent.php       ← el trabajo que va a la cola
```

El flujo exacto cuando un jugador inicia una partida:

```
1. Código de juego llama a: GameSessionStarted::dispatch(userId: 1, ...)
2. Laravel dispara el evento
3. El Listener intercepta el evento y crea un Job
4. El Job se serializa y se envía a la cola "default" de RabbitMQ
5. El Worker (proceso separado) recibe el Job y ejecuta handle()
6. handle() registra el evento en el log (en este proyecto)
   → en producción aquí iría: enviar email, actualizar estadísticas, etc.
```

---

### Cómo probar que RabbitMQ funciona (paso a paso)

#### Requisitos previos

- Docker corriendo con el contenedor de RabbitMQ activo
- Base de datos migrada (`php artisan migrate`)

#### Paso 1 — Levantar RabbitMQ

```bash
docker compose up rabbitmq
```

Espera hasta ver en los logs del contenedor:
```
Server startup complete; 4 plugins started.
```

#### Paso 2 — Verificar el panel web

Abre `http://localhost:15672` en el navegador.

- Usuario: `guest`
- Contraseña: `guest`

Deberías ver el dashboard de RabbitMQ. En la pestaña **Queues** aún no hay colas (se crean al primer mensaje).

#### Paso 3 — Arrancar el worker de Laravel

En una terminal separada desde `enso-crm/`:

```bash
php artisan queue:work rabbitmq --verbose
```

Si la conexión es correcta verás:
```
INFO  Processing jobs from the [default] queue.
```

El worker queda esperando mensajes (no hace nada hasta que llega uno).

#### Paso 4 — Publicar un evento de prueba

En otra terminal, abre tinker:

```bash
php artisan tinker
```

Dentro de tinker, despacha el evento:

```php
\App\Events\GameSessionStarted::dispatch(
    userId: 1,
    gameType: 'memory',
    sessionId: 'test-' . uniqid()
);
```

#### Paso 5 — Verificar los resultados

**En la terminal del worker** deberías ver inmediatamente:
```
2026-04-27 17:03:47 App\Jobs\ProcessDomainEvent ... RUNNING
2026-04-27 17:03:47 App\Jobs\ProcessDomainEvent ... DONE
```

**En `storage/logs/laravel.log`** (al final del archivo):
```
[RabbitMQ] Domain event received
{"event":"game_session.started","payload":{"user_id":1,"game_type":"memory",...}}
```

**En el panel web** (`http://localhost:15672` → Queues → default):
- La cola `default` habrá aparecido
- El contador `messages_acked` habrá subido (mensajes procesados correctamente)
- `messages_ready` será 0 porque el worker los procesó antes de que puedas mirar

> Si quieres ver mensajes pendientes en el panel, para el worker antes de despachar el evento. Los mensajes quedarán en `ready: 1` hasta que lo vuelvas a arrancar.

---

### Por qué los mensajes desaparecen tan rápido del panel

RabbitMQ no es una base de datos permanente: los mensajes existen en la cola solo mientras esperan ser procesados. Un mensaje bien procesado se elimina de la cola (ACK). Esto es por diseño: el objetivo es procesar y vaciar, no almacenar.

Para ver el historial de mensajes procesados tienes dos opciones:
1. **Panel web → Queues → default → Message rates**: gráfica de mensajes publicados y consumidos en el tiempo
2. **Los logs de Laravel**: `storage/logs/laravel.log` guarda cada ejecución del Job

---

### ¿Qué es MCP y para qué sirve?

MCP (Model Context Protocol) es un protocolo estándar creado por Anthropic que permite conectar herramientas de IA (Claude, Gemini, aplicaciones con OpenAI) a sistemas externos de forma controlada.

La clave para entenderlo: **Claude no "sabe" usar GitHub ni RabbitMQ por defecto**. Para que pueda operar sobre ellos, hay que conectarle explícitamente un servidor MCP que actúe de puente. Claude habla con el servidor MCP, el servidor MCP habla con el sistema externo, y los resultados vuelven a Claude.

```
Claude Code  <-->  Servidor MCP GitHub  <-->  API de GitHub
Claude Code  <-->  Servidor MCP RabbitMQ  <-->  RabbitMQ broker
```

Esto tiene una ventaja de seguridad importante: puedes controlar exactamente a qué tiene acceso Claude. En este proyecto Claude solo puede hacer `repos`, `issues` y `pull_requests` en GitHub — no puede borrar ramas ni acceder a otros repositorios.

---

### El MCP de GitHub: qué puede hacer Claude con él

Con el servidor MCP de GitHub activo, en lugar de explicarle conceptos a Claude, puedes pedirle acciones reales:

| Sin MCP | Con MCP |
|---|---|
| "Explícame qué es una pull request" | "Revisa la PR #12 y dime si falta validación en la API" |
| "¿Cómo creo una issue en GitHub?" | "Crea una issue para refactorizar web.php con un checklist" |
| "¿Qué hace el código de esta rama?" | "Lee la rama feature/chat y dime si rompe algo del sistema de roles" |

El servidor MCP que se usa es el oficial de GitHub (`ghcr.io/github/github-mcp-server`), que corre como contenedor Docker. La configuración está en `.claude/settings.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**`GITHUB_TOOLSETS`** limita las operaciones disponibles. No se le da acceso a `actions`, `code_security` ni `administration` porque no hacen falta y reducen el riesgo de operaciones no deseadas.

**`${GITHUB_TOKEN}`** es una referencia a una variable de entorno del sistema operativo. El token nunca se hardcodea en el archivo de configuración para no commitear credenciales al repositorio (aunque `.claude/` está en `.gitignore`).

Para configurar el token en Windows:
```
Panel de control → Sistema → Variables de entorno → Nueva
Nombre: GITHUB_TOKEN
Valor: ghp_tuTokenAqui
```

---

### El MCP de RabbitMQ: qué puede hacer Claude con él

Con el servidor MCP de RabbitMQ activo, Claude puede operar sobre el broker sin necesidad de abrir el panel web:

```
"¿Cuántos mensajes hay en la cola default?"
"¿Qué colas existen en el vhost /?"
"¿Hay alguna cola con mensajes sin procesar acumulados?"
"Lista los exchanges disponibles"
```

El servidor que se usa es `amq-mcp-server-rabbitmq` (de Amazon MQ), que se instala y ejecuta con `uvx` (el gestor de herramientas Python de `uv`):

```json
{
  "mcpServers": {
    "rabbitmq": {
      "command": "uvx",
      "args": ["amq-mcp-server-rabbitmq@latest", "--allow-mutative-tools"],
      "env": {
        "RABBITMQ_URL": "amqp://guest:guest@localhost:5672/"
      }
    }
  }
}
```

**`--allow-mutative-tools`** habilita operaciones de escritura (crear colas, publicar mensajes de prueba). Sin este flag solo se pueden hacer operaciones de lectura.

**`RABBITMQ_URL`** usa el formato AMQP estándar: `amqp://usuario:contraseña@host:puerto/vhost`.

---

### Cómo verificar que los servidores MCP están activos en Claude Code

En Claude Code (VS Code o terminal), ejecuta el comando:
```
/mcp
```

Deberías ver algo como:
```
● github    connected
● rabbitmq  connected
```

Si alguno aparece como `disconnected`:
- **github**: verifica que Docker está corriendo y que la variable `GITHUB_TOKEN` existe en el sistema
- **rabbitmq**: verifica que `uvx` está instalado (`uvx --version`) y que RabbitMQ está corriendo

---

### La arquitectura completa vista de forma pedagógica

Estos tres sistemas (Laravel + RabbitMQ + MCP) resuelven tres problemas distintos que coexisten en cualquier proyecto real:

**Laravel** resuelve el problema de la lógica de negocio: autenticación, CRUD, API, vistas. Es el núcleo de la aplicación. Sin Laravel no hay aplicación.

**RabbitMQ** resuelve el problema del acoplamiento temporal: si el envío de un email o el cálculo de estadísticas tarda 3 segundos, ¿debe el usuario esperar esos 3 segundos para recibir una respuesta? No. RabbitMQ permite que Laravel diga "aquí está tu respuesta, el resto se hará después" y delegar el trabajo a procesos independientes (workers). Hace la aplicación más resistente a fallos: si el worker cae, los mensajes siguen en la cola esperando.

**MCP** resuelve el problema de la asistencia inteligente en el flujo de trabajo: permite que una IA opere sobre el repositorio y la infraestructura con acceso controlado, sin que el desarrollador tenga que abandonar su entorno de trabajo para ir a GitHub a crear una issue o al panel de RabbitMQ a comprobar una cola.

```
Flujo de desarrollo con los tres activos:

1. Desarrollador trabaja en una feature en VS Code
2. Pide a Claude (via MCP GitHub): "Revisa esta rama antes de la PR"
3. Claude lee el código y sugiere mejoras
4. Desarrollador sube el código y abre la PR
5. Laravel, al detectar el evento, publica un mensaje en RabbitMQ
6. Un worker procesa el mensaje (notifica al equipo, lanza tests, etc.)
7. Claude puede consultar el estado de las colas via MCP RabbitMQ:
   "¿Se procesaron todos los eventos de esta sesión?"
```

El resultado es un proyecto que no solo funciona, sino que incorpora una forma de trabajar propia de entornos profesionales reales: código versionado, eventos desacoplados y asistencia inteligente integrada en el flujo.