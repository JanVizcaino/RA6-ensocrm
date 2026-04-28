# ENSO CRM — Plataforma de juegos cognitivos

ENSO CRM es una plataforma web para la gestión y análisis de juegos cognitivos que he desarrollado como proyecto académico en dos módulos: **Desarrollo Web en Entorno Servidor** y **Despliegue de Aplicaciones Web**.

He combinado un CRM completo construido con Laravel 12 con capacidades avanzadas: reconocimiento facial, detección de emociones en tiempo real, chat con WebSockets, mensajería asíncrona con RabbitMQ y despliegue en una Raspberry Pi 5. Además, he integrado una capa de asistencia inteligente mediante MCP (Model Context Protocol) que conecta Claude Code con GitHub y con el propio broker de mensajería.

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
| Mensajería asíncrona | RabbitMQ 3 |
| Asistencia IA | Claude Code + MCP (GitHub, RabbitMQ) |
| Despliegue | Raspberry Pi 5, Ngrok |

---

## Arquitectura general

He diseñado el proyecto siguiendo una arquitectura de servicios desacoplados. Laravel actúa como núcleo central: gestiona usuarios, sesiones, la API y la lógica de negocio. He delegado las responsabilidades especializadas (reconocimiento facial, juegos) a servicios externos que se comunican con Laravel por HTTP.

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

He añadido además una capa de asistencia inteligente que conecta todos los elementos:

```
GitHub  -->  GitHub MCP  -->  Claude Code  -->  Laravel / scripts  -->  RabbitMQ  -->  workers
```

MCP (Model Context Protocol) no es una librería de Laravel ni parte del repositorio: es el protocolo que me permite que Claude Code opere sobre el repositorio de forma controlada (leer issues, revisar PRs, sugerir cambios) sin acceso arbitrario.

---

## Sistema de roles

He implementado tres roles con acceso diferenciado:

- **Admin**: panel de gestión completo, CRUD de usuarios y juegos, acceso al historial de todos los jugadores.
- **Gestor**: puede publicar y despublicar juegos, revisar estadísticas.
- **Player**: accede al catálogo de juegos publicados, juega y consulta su propio historial emocional.

He aplicado el control de acceso mediante middleware `CheckRole` en todas las rutas protegidas. He separado las rutas web (vistas Inertia) y las rutas API (JSON + Sanctum) en `web.php` y `api.php` respectivamente.

---

## Reconocimiento facial con microservicio Python

He delegado el reconocimiento facial completamente a un microservicio independiente escrito en Python con **FastAPI** y **DeepFace**. Laravel no procesa imágenes ni ejecuta modelos de visión artificial: coordina, valida y decide.

### Flujo de verificación

1. El navegador captura un frame de la webcam y lo envía a Laravel (`POST /api/facial/verify`).
2. Laravel recupera la foto registrada del usuario desde el disco privado.
3. Laravel envía ambas imágenes al microservicio vía HTTP multipart.
4. El microservicio compara los rostros con el modelo **VGG-Face** y devuelve `verified`, `distance` y el umbral aplicado.
5. Laravel interpreta la respuesta, inicia sesión si procede y redirige al dashboard correspondiente.

### Configuración del microservicio

He configurado el microservicio para correr en Docker. He ajustado el umbral de distancia coseno a `0.5` (más permisivo que el valor por defecto de DeepFace de `0.68`) para mejorar la tasa de aceptación en condiciones de iluminación variable.

Los pesos del modelo (~580 MB, VGG-Face) los persisto en un volumen Docker llamado `deepface_models` para evitar descargas en cada reinicio del contenedor.

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

He configurado la red de Docker con `bip: 10.10.0.1/16` para evitar colisiones con la red local.

### Registro de foto (enroll)

Los usuarios pueden registrar o actualizar su foto facial desde su perfil. He almacenado la foto en el disco `private` de Laravel (`storage/app/private/faces/{id}.jpg`), nunca accesible públicamente.

---

## Detección de emociones durante el juego

Mientras el jugador juega, he implementado la detección de sus expresiones faciales en tiempo real directamente en el navegador usando **face-api.js**. Esta funcionalidad no identifica personas: observa la interacción para poder analizar cómo se usa cada juego.

### Dónde ocurre la detección

La detección ocurre completamente en el cliente. El navegador accede a la webcam, analiza frames localmente y obtiene probabilidades de expresiones básicas (`neutral`, `happy`, `sad`, `angry`, `surprised`, `fearful`, `disgusted`). Laravel no recibe imágenes ni vídeo, solo datos ya interpretados.

### Frecuencia de muestreo

No proceso a 30 fps. He configurado la detección para ejecutarse a intervalos razonables (cada pocos segundos) para no generar ruido ni sobrecargar la API.

### Persistencia en base de datos

Al finalizar la partida, guardo las emociones detectadas en la tabla `game_emotions` asociadas a la sesión de juego (`user_game_id`). Cada registro almacena la emoción detectada y el timestamp.

He expuesto la relación en el modelo `UserGame`:

```php
public function emotions(): HasMany
{
    return $this->hasMany(GameEmotion::class, 'user_game_id');
}
```

---

## Historial de partidas

He implementado una vista de historial en `/history` donde los jugadores pueden consultar sus partidas. Para cada sesión se muestra:

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

He resuelto el historial con eager loading de juego y emociones para evitar el problema N+1:

```php
UserGame::where('user_id', Auth::user()->id)
    ->orderBy('played_at', 'desc')
    ->with(['game', 'emotions'])
    ->get();
```

---

## Chat en tiempo real con WebSockets

He implementado un chat contextualizado con **Laravel Reverb**, el servidor de WebSockets nativo de Laravel. A diferencia de las peticiones HTTP convencionales, Reverb mantiene una conexión TCP bidireccional abierta entre cliente y servidor, logrando que los mensajes aparezcan instantáneamente sin recargar la página.

He optado por **Inertia.js con React** en el frontend, descartando Livewire porque ambas tecnologías resuelven el mismo problema con enfoques incompatibles. He integrado Reverb a través del sistema de eventos de Laravel y Laravel Echo en el cliente.

### Configuración necesaria en `.env`

```env
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database
```

He configurado los eventos del chat para procesarse mediante jobs en segundo plano (cola de base de datos) y no bloquear las peticiones HTTP.

### Instalación

```bash
php artisan install:broadcasting
php artisan migrate
php artisan queue:work
php artisan reverb:start
```

---

## Capa de eventos con RabbitMQ

He integrado RabbitMQ como broker de mensajería asíncrona. Cuando ocurre algo relevante en el sistema (inicio de una sesión de juego, finalización de una validación, publicación de un juego), Laravel publica un evento en una cola en lugar de procesarlo todo de forma síncrona en la misma petición HTTP.

He tomado esta decisión para desacoplar los procesos pesados del flujo principal y acercar el proyecto a la arquitectura de entornos reales.

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

Con el contenedor en marcha, el panel de administración de RabbitMQ está disponible en `http://localhost:15672`. Las credenciales se configuran mediante variables de entorno:

```env
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

> **Importante**: cambiar las credenciales antes de desplegar en producción.

### Por qué coexisten RabbitMQ y la cola de base de datos

He mantenido `QUEUE_CONNECTION=rabbitmq` para los eventos de dominio, pero Laravel Reverb (el sistema de WebSockets) usa internamente `QUEUE_CONNECTION=database` para sus jobs de broadcasting. He dejado los dos coexistiendo con responsabilidades distintas: RabbitMQ para eventos de negocio desacoplados, la base de datos para la infraestructura interna de Reverb.

---

## Asistencia inteligente con MCP

He configurado MCP (Model Context Protocol) para conectar Claude Code con GitHub y con RabbitMQ. MCP es un protocolo estándar que permite que herramientas de IA se conecten a sistemas externos de forma controlada.

Gracias a esta integración, en lugar de pedirle a la IA explicaciones genéricas, puedo pedirle acciones reales sobre el repositorio y la infraestructura:

> *"Revisa esta PR y dime si falta validación en la API de sesiones."*
> *"Crea una issue para separar web.php y api.php con un checklist de terminado."*
> *"Comprueba si la cola de eventos está recibiendo mensajes."*

### Configuración del servidor MCP de GitHub

He declarado la configuración en `.claude/settings.json` en la raíz del proyecto. Claude Code la carga automáticamente al abrir el directorio.

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

He limitado el acceso a `repos`, `issues` y `pull_requests` con `GITHUB_TOOLSETS`. No he dado acceso a `actions`, `code_security` ni `administration` porque no son necesarios y aumentarían el riesgo de operaciones no deseadas.

He referenciado el token con `${GITHUB_TOKEN}` en lugar de hardcodearlo, apuntando a una variable de entorno del sistema operativo para no exponer credenciales en el repositorio.

### Token de GitHub

He generado un Personal Access Token (PAT) en GitHub con permisos mínimos: `repo` (lectura), `issues` y `pull_requests`. Lo he exportado como variable de entorno del sistema en Windows:

```
Panel de control → Sistema → Variables de entorno → Nueva
Nombre: GITHUB_TOKEN
Valor: ghp_tuTokenAqui
```

### Configuración del servidor MCP de RabbitMQ

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

He usado `uvx` (el gestor de herramientas de `uv`, instalado en el sistema) para ejecutar el servidor sin instalación permanente. Con `--allow-mutative-tools` habilito operaciones de escritura además de lectura.

### Por qué he elegido estos servidores MCP y no otros

He elegido el servidor oficial de GitHub (`ghcr.io/github/github-mcp-server`) porque está mantenido directamente por GitHub, tiene imagen pública de Docker y permite limitar el alcance con `GITHUB_TOOLSETS`. Para RabbitMQ no existe un servidor oficial único; he optado por `amq-mcp-server-rabbitmq` (Amazon MQ) porque tiene la documentación más completa y la release más reciente en el ecosistema.

---

## Despliegue en Raspberry Pi 5

He desplegado la aplicación completa en una **Raspberry Pi 5** con Docker. El microservicio de reconocimiento facial corre como contenedor junto a Laravel, comunicándose por red interna.

### HTTPS con Ngrok

La webcam del navegador requiere un contexto seguro (HTTPS) para funcionar. He usado **Ngrok** para exponer la Raspberry Pi con un túnel HTTPS público, evitando la necesidad de un certificado SSL propio y permitiendo el acceso desde cualquier dispositivo de la red.

He arrancado Ngrok en un proceso separado para que no interfiera con la sesión SSH:

```bash
nohup ngrok http 8000 &
```

He configurado la URL pública de Ngrok en `APP_URL` y en los dominios stateful de Sanctum para que las cookies de sesión funcionen correctamente.

### Consideraciones de red

He configurado `docker-compose.yml` con `bip: 10.10.0.1/16` para aislar la red de Docker de la red local de la Raspberry y evitar que las rutas colisionen, lo que podría cortar la conexión SSH durante el despliegue.

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

### Variables de entorno necesarias

```env
FACIAL_SERVICE_URL=http://127.0.0.1:8181/verify

RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_QUEUE=default
```

### Panel de gestión de RabbitMQ

Una vez levantado Docker, el panel web está en `http://localhost:15672` (usuario/contraseña según `.env`).

---

## Flujo completo con MCP activo

Con Claude Code abierto en el proyecto y el MCP configurado, el flujo de trabajo queda así:

1. Abro una rama (`git checkout -b feature/nueva-funcionalidad`)
2. Pido a Claude Code que revise la PR antes de mergearla
3. Claude lee el diff via GitHub MCP y detecta si falta validación o documentación
4. Al abrir la PR en GitHub, Laravel publica un evento en RabbitMQ para notificar o lanzar pruebas automatizadas
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

## Documentación técnica: RabbitMQ y MCP

Esta sección documenta en profundidad las dos integraciones más avanzadas del proyecto: la mensajería asíncrona con RabbitMQ y la asistencia inteligente con MCP. Explico qué son, por qué los he elegido, cómo los he integrado y cómo verificar que funcionan.

---

### ¿Qué es RabbitMQ y por qué lo he usado?

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

He optado por este modelo porque el usuario recibe una respuesta rápida y el trabajo pesado (enviar un email, calcular estadísticas, notificar a otros servicios) ocurre después, sin bloquear la experiencia.

---

### Conceptos clave de RabbitMQ

**Cola (Queue)**: almacén de mensajes. Los mensajes se encolan y se entregan en orden (FIFO). He nombrado la cola principal `default`.

**Productor**: quien publica mensajes en la cola. En este proyecto es Laravel a través de los Jobs.

**Consumidor (Worker)**: proceso que escucha la cola y procesa los mensajes. Se arranca con `php artisan queue:work rabbitmq`.

**Exchange**: punto de entrada por el que los productores envían mensajes. El exchange decide a qué colas enrutar el mensaje según reglas. He usado el exchange por defecto en la configuración básica.

**Vhost (Virtual Host)**: espacio de nombres dentro de RabbitMQ, como una base de datos separada. He usado `/` (el vhost raíz) por defecto.

**Mensaje**: el contenido que viaja por la cola. Cada mensaje es un Job serializado de Laravel con el evento de dominio (`game_session.started`, etc.).

**ACK (Acknowledgement)**: confirmación de que un mensaje fue procesado correctamente. Si el worker confirma (ACK), RabbitMQ elimina el mensaje de la cola. Si falla, puede reencolarlo.

---

### Cómo he integrado RabbitMQ en el proyecto

La integración tiene tres capas:

**1. Infraestructura** — He declarado RabbitMQ como contenedor Docker en `docker-compose.yml`:
```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"   # puerto AMQP (protocolo de mensajería)
    - "15672:15672" # panel web de administración
```

**2. Laravel** — He instalado el paquete `vladimir-yuldashev/laravel-queue-rabbitmq` para que el sistema de colas de Laravel use RabbitMQ como backend. He declarado la conexión en `config/queue.php` y la he activado con `QUEUE_CONNECTION=rabbitmq` en `.env`. También he habilitado la extensión `ext-sockets` de PHP en `php.ini`, necesaria para que `php-amqplib` funcione.

**3. Código de aplicación** — He creado tres archivos que definen la cadena completa:

```
app/Events/GameSessionStarted.php                  ← el hecho que ocurrió
app/Listeners/PublishGameSessionToRabbitMQ.php     ← reacciona al evento
app/Jobs/ProcessDomainEvent.php                    ← el trabajo que va a la cola
```

He registrado el binding en `AppServiceProvider`:

```php
Event::listen(GameSessionStarted::class, PublishGameSessionToRabbitMQ::class);
```

El flujo exacto cuando se inicia una partida:

```
1. GameSessionStarted::dispatch(userId: 1, ...) es llamado
2. Laravel dispara el evento
3. El Listener intercepta el evento y crea un Job
4. El Job se serializa y se envía a la cola "default" de RabbitMQ
5. El Worker recibe el Job y ejecuta handle()
6. handle() registra el evento en el log
   → en producción aquí iría: enviar email, actualizar estadísticas, etc.
```

---

### Cómo probar que RabbitMQ funciona

#### Requisitos previos

- Docker corriendo con el contenedor de RabbitMQ activo
- Base de datos migrada (`php artisan migrate`)

#### Paso 1 — Levantar RabbitMQ

```bash
docker compose up rabbitmq
```

Esperar hasta ver en los logs del contenedor:
```
Server startup complete; 4 plugins started.
```

#### Paso 2 — Verificar el panel web

Abrir `http://localhost:15672` → usuario `guest`, contraseña `guest`. En la pestaña **Queues** aún no hay colas porque se crean al primer mensaje.

#### Paso 3 — Publicar un evento desde Tinker

Abrir Tinker **sin arrancar el worker** (así el mensaje queda visible en el panel):

```bash
php artisan tinker
```

```php
\App\Jobs\ProcessDomainEvent::dispatch('game_session.started', [
    'user_id'    => 1,
    'game_type'  => 'memory',
    'session_id' => 'demo-' . uniqid(),
    'timestamp'  => now()->toISOString(),
]);
```

![Comando Tinker publicando el evento en RabbitMQ](docs/1_RABBIT_EVENT_TINKER_CMD.png)

#### Paso 4 — Ver el mensaje en el panel

El mensaje queda en la cola `default` con estado `ready: 1`. En el panel web (Queues → default → Get messages) se puede inspeccionar el contenido del mensaje.

![Panel de RabbitMQ con el mensaje en cola](docs/2_RABBIT_EVENT_MESSAGE_DASHBOARD.png)

#### Paso 5 — Arrancar el worker y procesar el mensaje

```bash
php artisan queue:work rabbitmq --verbose
```

El worker procesa el Job inmediatamente:

```
2026-04-27 17:03:47 App\Jobs\ProcessDomainEvent ... RUNNING
2026-04-27 17:03:47 App\Jobs\ProcessDomainEvent ... DONE
```

![Terminal del worker procesando el Job](docs/3_RABBIT_EVENT_WORK_CMD.png)

#### Paso 6 — Verificar que la cola queda vacía

Tras el procesamiento, el panel muestra `messages_ready: 0`. El mensaje ha sido confirmado (ACK) y eliminado de la cola. El log de Laravel registra la ejecución en `storage/logs/laravel.log`:

```
[RabbitMQ] Domain event received
{"event":"game_session.started","payload":{"user_id":1,"game_type":"memory",...}}
```

![Panel de RabbitMQ tras procesar el mensaje](docs/4_RABBIT_EVENT_NOT_MESSAGE_DASHBOARD.png)

---

### Por qué los mensajes desaparecen del panel

RabbitMQ no es una base de datos permanente: los mensajes existen en la cola solo mientras esperan ser procesados. Un mensaje confirmado (ACK) se elimina de inmediato. Para ver el historial hay dos opciones:

1. **Panel web → Queues → default → Message rates**: gráfica de mensajes publicados y consumidos en el tiempo.
2. **`storage/logs/laravel.log`**: guarda cada ejecución del Job con el payload completo.

---

### ¿Qué es MCP y por qué lo he integrado?

MCP (Model Context Protocol) es un protocolo estándar creado por Anthropic que permite conectar herramientas de IA (Claude, Gemini, aplicaciones con OpenAI) a sistemas externos de forma controlada.

He integrado MCP porque **Claude Code no tiene acceso a GitHub ni a RabbitMQ por defecto**. Para que pueda operar sobre ellos, he conectado explícitamente servidores MCP que actúan de puente. Claude habla con el servidor MCP, el servidor habla con el sistema externo, y los resultados vuelven a Claude:

```
Claude Code  <-->  Servidor MCP GitHub   <-->  API de GitHub
Claude Code  <-->  Servidor MCP RabbitMQ <-->  RabbitMQ broker
```

Esto me da control exacto sobre qué puede hacer Claude. He limitado el acceso de GitHub a `repos`, `issues` y `pull_requests` — no puede borrar ramas ni acceder a otros repositorios.

---

### Lo que puedo hacer con el MCP de GitHub

Con el servidor MCP de GitHub activo puedo pedirle a Claude acciones reales en lugar de explicaciones genéricas:

| Sin MCP | Con MCP |
|---|---|
| "Explícame qué es una pull request" | "Revisa la PR #12 y dime si falta validación en la API" |
| "¿Cómo creo una issue en GitHub?" | "Crea una issue para refactorizar web.php con un checklist" |
| "¿Qué hace el código de esta rama?" | "Lee la rama feature/chat y dime si rompe algo del sistema de roles" |

He elegido el servidor oficial de GitHub (`ghcr.io/github/github-mcp-server`) porque está mantenido directamente por GitHub, tiene imagen pública de Docker y el alcance es configurable con `GITHUB_TOOLSETS`.

---

### Lo que puedo hacer con el MCP de RabbitMQ

Con el servidor MCP de RabbitMQ activo puedo consultar el broker directamente desde Claude Code sin abrir el panel web:

```
"¿Cuántos mensajes hay en la cola default?"
"¿Qué colas existen en el vhost /?"
"¿Hay alguna cola con mensajes sin procesar acumulados?"
"Lista los exchanges disponibles"
```

He elegido `amq-mcp-server-rabbitmq` (Amazon MQ) porque tiene la documentación más completa y la release más reciente en el ecosistema MCP.

---

### Configuración MCP completa en `.claude/settings.json`

He declarado ambos servidores en el archivo `.claude/settings.json` en la raíz del proyecto:

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
    },
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

Claude Code carga esta configuración automáticamente al abrir el directorio del proyecto. El token de GitHub lo he definido como variable de entorno del sistema (`GITHUB_TOKEN`) en lugar de hardcodearlo, aunque `.claude/` está en `.gitignore`.

![Configuración MCP en Claude Code](docs/5_MCP.png)

Para verificar que los servidores están conectados, ejecutar en la CLI de Claude Code:

```
/mcp
```

Debe mostrar:
```
● github    connected
● rabbitmq  connected
```

Si aparece `disconnected`: verificar que Docker está corriendo (GitHub MCP) y que `uvx` está instalado y RabbitMQ activo (RabbitMQ MCP).

---

### Por qué los tres sistemas se complementan

He integrado Laravel, RabbitMQ y MCP porque cada uno resuelve un problema distinto que coexiste en cualquier proyecto real:

**Laravel** resuelve la lógica de negocio: autenticación, CRUD, API, vistas. Es el núcleo. Sin Laravel no hay aplicación.

**RabbitMQ** resuelve el acoplamiento temporal: si calcular estadísticas o enviar un email tarda 3 segundos, el usuario no debe esperar. RabbitMQ permite que Laravel delegue ese trabajo a procesos independientes y responda de inmediato. Además hace el sistema más resistente: si el worker cae, los mensajes siguen en la cola esperando.

**MCP** resuelve la asistencia inteligente en el flujo de trabajo: me permite pedirle a Claude que opere sobre el repositorio y la infraestructura sin salir del entorno de desarrollo. No es un añadido estético — es una herramienta que uso activamente para revisar código, gestionar issues y monitorizar colas.

```
Flujo de trabajo con los tres activos:

1. Trabajo en una feature en VS Code
2. Pido a Claude (via MCP GitHub): "Revisa esta rama antes de la PR"
3. Claude lee el código y sugiere mejoras
4. Subo el código y abro la PR
5. Laravel detecta el evento y publica un mensaje en RabbitMQ
6. Un worker procesa el mensaje (notifica, lanza tests, registra métricas)
7. Consulto a Claude via MCP RabbitMQ: "¿Se procesaron todos los eventos?"
```

El resultado es un proyecto que no solo funciona, sino que incorpora una forma de trabajar propia de entornos profesionales: código versionado, eventos desacoplados y asistencia inteligente integrada en el flujo.
