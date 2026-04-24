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