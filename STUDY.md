# STUDY.md — Guía de defensa del proyecto ENSO CRM

> Referencia rápida para la evaluación oral. Cada respuesta incluye el archivo exacto y el fragmento de código relevante.

---

## 1. ¿A través de qué archivo Inertia le manda los datos a React?

**Inertia actúa como puente entre Laravel (PHP) y React (TypeScript).** El flujo es:

1. El controlador PHP llama a `Inertia::render('NombrePágina', ['clave' => $valor])`
2. Inertia serializa los datos como props JSON y los inyecta en la respuesta HTML
3. En el frontend, React recibe esas props directamente en el componente de la página

**Punto de entrada frontend:**
[`enso-crm/resources/js/app.tsx`](enso-crm/resources/js/app.tsx) — Aquí se inicializa la app Inertia con `createInertiaApp()` y se resuelven los componentes desde `./Pages/{name}.tsx`

**Ejemplos de render con props en los controladores:**

```php
// enso-crm/app/Http/Controllers/Admin/GameController.php
return Inertia::render('Admin/Games', [
    'games' => $games,
]);
```

```php
// enso-crm/app/Http/Controllers/Player/GameController.php
return Inertia::render('Player/Index', [
    'games' => $games,  // Solo los juegos publicados
]);

return Inertia::render('Player/Play', [
    'game' => $game,
]);

return Inertia::render('/History', [
    'userHistory' => $history,
]);
```

```php
// enso-crm/app/Http/Controllers/Auth/AuthenticatedSessionController.php
return Inertia::render('Auth/Login', [
    'canResetPassword' => Route::has('password.request'),
    'status'           => session('status'),
]);
```

**En el componente React**, las props llegan automáticamente como parámetros del componente:

```tsx
// enso-crm/resources/js/Pages/Player/Index.tsx
export default function Index({ games }: { games: Game[] }) {
    // `games` viene de Inertia directamente desde PHP
}
```

**Resumen:** No hay ningún fetch/AJAX manual. Inertia serializa los datos PHP como JSON en la primera carga (SSR-like) y en las navegaciones posteriores hace una petición XHR que devuelve solo los props en JSON, **sin recargar la página**. El archivo clave de la página que recibe los datos es siempre el componente en [`enso-crm/resources/js/Pages/`](enso-crm/resources/js/Pages/).

---

## 2. ¿Cómo se crea la base de datos?

La base de datos se crea mediante **migraciones de Laravel** ejecutando `php artisan migrate`.

**Carpeta de migraciones:** [`enso-crm/database/migrations/`](enso-crm/database/migrations/)

**Listado de migraciones en orden de ejecución:**

| Archivo | Tabla creada |
|---|---|
| `0001_01_01_000000_create_users_table.php` | `users` (base) |
| `0001_01_01_000001_create_cache_table.php` | `cache` |
| `0001_01_01_000002_create_jobs_table.php` | `jobs` (colas internas) |
| `2026_03_12_173506_create_enso_roles_table.php` | Roles del sistema |
| `2026_03_12_173511_modify_users_table_for_enso.php` | Añade columna `role` ENUM a `users` |
| `2026_03_12_173515_create_enso_games_table.php` | `enso_games` |
| `2026_03_12_173523_create_enso_collections_table.php` | `enso_collections` |
| `2026_03_12_173527_create_enso_collections_games_table.php` | Pivot colección-juego |
| `2026_03_12_173531_create_enso_users_games_table.php` | Historial usuario-juego |
| `2026_03_12_173535_create_enso_game_emotions_table.php` | Emociones detectadas |
| `2026_03_23_000001_add_gestor_to_users_role_enum.php` | Añade rol `gestor` |
| `2026_03_23_182607_create_personal_access_tokens_table.php` | Tokens Sanctum |
| `2026_03_24_153212_add_face_photo_to_users_table.php` | Ruta foto facial |
| `2026_04_16_135034_create_messages_table.php` | `messages` (chat) |

**Ejemplo de migración de juegos:**

```php
// enso-crm/database/migrations/2026_03_12_173515_create_enso_games_table.php
Schema::create('enso_games', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->string('path');              // Ruta al bundle Three.js
    $table->boolean('is_published')->default(false);
    $table->timestamps();
});
```

**Ejemplo de migración de mensajes (chat):**

```php
// enso-crm/database/migrations/2026_04_16_135034_create_messages_table.php
Schema::create('messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->text('body');
    $table->timestamps();
});
```

**En Docker**, la base de datos PostgreSQL arranca automáticamente con el contenedor `db` y las migraciones se ejecutan manualmente o al desplegar:

```bash
php artisan migrate
```

---

## 3. ¿Cómo se llena la base de datos?

Mediante **seeders** (y factories para datos de prueba), ejecutando `php artisan db:seed`.

**Archivo principal:** [`enso-crm/database/seeders/DatabaseSeeder.php`](enso-crm/database/seeders/DatabaseSeeder.php)

```php
// DatabaseSeeder.php — Crea usuarios y un juego de prueba
User::create([
    'name'     => 'Admin',
    'email'    => 'admin@enso.com',
    'password' => Hash::make('password123'),
    'role'     => 'admin',
]);

User::create([
    'name'     => 'Gestor',
    'email'    => 'gestor@enso.com',
    'password' => Hash::make('password123'),
    'role'     => 'gestor',
]);

User::create([
    'name'     => 'Jugador',
    'email'    => 'jugador@enso.com',
    'password' => Hash::make('password123'),
    'role'     => 'player',
]);

// Juego de demostración
Game::create([
    'name'         => 'Wisconsin 3D',
    'description'  => 'Card Sorting Game',
    'path'         => 'wisconsin3d',
    'is_published' => true,
]);
```

**Factory:** [`enso-crm/database/factories/UserFactory.php`](enso-crm/database/factories/UserFactory.php) — Para generar usuarios de prueba masivos con `User::factory()->count(10)->create()`.

**Comando combinado para empezar desde cero:**

```bash
php artisan migrate:fresh --seed
```

---

## 4. ¿Cómo se conecta a la base de datos?

**Motor:** PostgreSQL 15 (contenedor Docker `db`)

**Configuración en `.env`:** [`enso-crm/.env`](enso-crm/.env)

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5434          # Puerto externo (internamente es 5432)
DB_DATABASE=enso_lite_db
DB_USERNAME=enso_lite_user
DB_PASSWORD=secret
```

**Archivo de configuración:** [`enso-crm/config/database.php`](enso-crm/config/database.php)

```php
'default' => env('DB_CONNECTION', 'pgsql'),

'pgsql' => [
    'driver'   => 'pgsql',
    'host'     => env('DB_HOST', '127.0.0.1'),
    'port'     => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'sslmode'  => 'prefer',
    'search_path' => 'public',
],
```

**En Docker Compose**, el servicio Reverb se conecta a la BD por nombre de servicio interno (`db`):

```yaml
# enso-crm/docker-compose.yml
reverb:
  environment:
    DB_HOST: db        # Nombre del contenedor, no localhost
    DB_PORT: 5432      # Puerto interno del contenedor
```

**Laravel usa Eloquent ORM** para todas las operaciones de base de datos. Los modelos están en [`enso-crm/app/Models/`](enso-crm/app/Models/). Ejemplo: `Game::all()`, `User::find($id)`, `Message::create([...])`.

---

## 5. Docker — ¿Para qué se usa, cómo se levanta, para qué sirve un Dockerfile?

### ¿Para qué se usa Docker en este proyecto?

Docker permite ejecutar todos los servicios del proyecto (base de datos, microservicio Python, servidor WebSocket, proxy inverso...) de forma aislada y reproducible, sin instalar nada manualmente en el sistema operativo host.

### Servicios definidos en [`enso-crm/docker-compose.yml`](enso-crm/docker-compose.yml):

| Servicio | Imagen | Puerto | Función |
|---|---|---|---|
| `db` | `postgres:15-alpine` | `5434:5432` | Base de datos PostgreSQL |
| `facial-api` | Build propio | `8181:5000` | Microservicio Python de reconocimiento facial |
| `rabbitmq` | `rabbitmq:3-management` | `5672`, `15672` | Cola de mensajes + panel web |
| `reverb` | Build propio | `8765:8080` | Servidor WebSocket de Laravel |
| `caddy` | `caddy:2-alpine` | `80`, `443` | Reverse proxy + HTTPS automático |
| `uptime_kuma` | `louislam/uptime-kuma:1` | `3001` | Monitorización de servicios |
| `duckdns` | `linuxserver/duckdns` | — | DNS dinámico para dominio público |

### ¿Cómo se levanta?

```bash
# Levantar todos los servicios en background
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Parar todo
docker compose down

# Reconstruir imágenes y levantar
docker compose up -d --build
```

### ¿Para qué sirve un Dockerfile?

Un Dockerfile es un script con instrucciones para construir una imagen Docker personalizada. Es como una receta: define el sistema operativo base, las dependencias a instalar, el código a copiar y el comando a ejecutar.

**Dockerfile del microservicio facial:** [`enso-crm/microservicio_facial/Dockerfile`](enso-crm/microservicio_facial/Dockerfile)

```dockerfile
FROM python:3.10-slim                    # Imagen base: Python 3.10 ligera
WORKDIR /app                             # Directorio de trabajo dentro del contenedor
RUN apt-get install -y libgl1 libglib2.0-0 ...  # Dependencias del sistema para OpenCV
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt  # Instala librerías Python
COPY main.py .
EXPOSE 5000                              # Documenta el puerto que usará
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
```

**Dockerfile de Reverb (WebSocket):** [`enso-crm/docker/reverb/Dockerfile`](enso-crm/docker/reverb/Dockerfile)

```dockerfile
FROM php:8.2-cli
RUN apt-get install -y libpq-dev unzip git && \
    docker-php-ext-install pdo pdo_pgsql pcntl   # Extensiones PHP para PostgreSQL
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
```

---

## 6. Reconocimiento facial — ¿Qué librería se usa y en qué lenguaje?

### Microservicio de verificación de identidad (servidor)

- **Lenguaje:** Python
- **Framework:** FastAPI
- **Librería principal:** **DeepFace v0.0.93** con modelo **VGG-Face**
- **Detector de rostros:** OpenCV
- **Servidor:** Uvicorn

**Archivo principal:** [`enso-crm/microservicio_facial/main.py`](enso-crm/microservicio_facial/main.py)

```python
# Endpoint POST /verify — Compara dos imágenes de cara
result = DeepFace.verify(
    img1_path=img1_path,
    img2_path=img2_path,
    model_name="VGG-Face",
    detector_backend="opencv",
    distance_metric="cosine",
    enforce_detection=False,
)
# threshold personalizado: 0.5 (más permisivo que el 0.68 por defecto)
```

**Requisitos:** [`enso-crm/microservicio_facial/requirements.txt`](enso-crm/microservicio_facial/requirements.txt)

### Flujo completo de verificación facial:

1. Al registrarse, el admin sube una foto del usuario → se guarda en `storage/app/private/faces/{id}.jpg`
2. Al hacer login, el usuario escribe su email y captura su cara con la webcam
3. Laravel recibe ambas imágenes y las manda al microservicio FastAPI en `http://facial-api:5000/verify`
4. DeepFace compara las dos caras y devuelve `verified: true/false` + `distance`
5. Si `verified`, Laravel autentica al usuario con `Auth::login($user)`

**Controlador Laravel:** [`enso-crm/app/Http/Controllers/Api/FaceController.php`](enso-crm/app/Http/Controllers/Api/FaceController.php)

### Detección de emociones en tiempo real (frontend)

- **Librería:** `face-api.js` (corre en el navegador, no en el servidor)
- **Lenguaje:** TypeScript / JavaScript
- No envía imágenes al servidor — solo los datos de emoción detectada
- Los resultados se guardan en la tabla `enso_game_emotions`

---

## 7. Chat y WebSockets — ¿Para qué sirven y cómo se usan?

### ¿Por qué WebSockets y no HTTP normal?

HTTP es unidireccional: el cliente pide, el servidor responde y se cierra la conexión. Para un chat en tiempo real se necesita que el **servidor pueda enviar mensajes al cliente** sin que este lo pida. Los WebSockets mantienen una conexión persistente bidireccional.

### Stack usado:

- **Servidor WebSocket:** Laravel Reverb (contenedor Docker propio)
- **Cliente frontend:** Laravel Echo (librería JS)
- **Configuración:** [`enso-crm/config/reverb.php`](enso-crm/config/reverb.php)

### Flujo de un mensaje de chat:

```
Usuario escribe → POST /api-web/messages → MessageController::store()
    → Crea registro en tabla `messages`
    → broadcast(new MessageSent($message))  ← Evento Laravel
    → Reverb envía el evento por WebSocket a todos los clientes suscritos
    → Laravel Echo recibe el evento en el navegador
    → React actualiza la UI sin recargar
```

**Evento:** [`enso-crm/app/Events/MessageSent.php`](enso-crm/app/Events/MessageSent.php)

```php
class MessageSent implements ShouldBroadcastNow
{
    public function broadcastOn(): array {
        return [new Channel('chat')];   // Canal público "chat"
    }

    public function broadcastWith(): array {
        return [
            'id'         => $this->message->id,
            'body'       => $this->message->body,
            'created_at' => $this->message->created_at,
            'user'       => [
                'id'   => $this->message->user->id,
                'name' => $this->message->user->name,
                'role' => $this->message->user->role,
            ],
        ];
    }
}
```

**Controlador de mensajes:** [`enso-crm/app/Http/Controllers/Api/MessageController.php`](enso-crm/app/Http/Controllers/Api/MessageController.php)

**Canales de broadcasting:** [`enso-crm/routes/channels.php`](enso-crm/routes/channels.php)

```php
// Canal público para el chat global
Broadcast::channel('chat', function () { return true; });

// Canal privado por usuario (notificaciones)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
```

**Frontend — Suscripción en Bootstrap:** [`enso-crm/resources/js/bootstrap.ts`](enso-crm/resources/js/bootstrap.ts)

```typescript
window.Echo = new Echo({
    broadcaster: 'reverb',
    key:         import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:      import.meta.env.VITE_REVERB_HOST,
    wsPort:      import.meta.env.VITE_REVERB_PORT,
    wssPort:     import.meta.env.VITE_REVERB_PORT,
    forceTLS:    false,
});

// En el componente React del chat:
window.Echo.channel('chat').listen('MessageSent', (e) => {
    setMessages(prev => [...prev, e]);
});
```

---

## 8. RabbitMQ — ¿Para qué sirve y cómo se usa?

### ¿Qué es RabbitMQ?

RabbitMQ es un **message broker** (intermediario de mensajes). Permite que distintas partes de un sistema se comuniquen de forma asíncrona a través de colas. Un productor publica un mensaje en una cola y un consumidor lo procesa, independientemente uno del otro.

### ¿Por qué se usa aquí?

Para **desacoplar el procesamiento de eventos de juego** del flujo principal de la petición HTTP. Cuando empieza una sesión de juego, en lugar de procesarlo de forma síncrona (bloqueando la respuesta), se publica un evento en RabbitMQ y un worker lo consume en segundo plano.

### Flujo de eventos:

```
Juego empieza → GameSessionStarted (Evento Laravel)
    → PublishGameSessionToRabbitMQ (Listener)
    → ProcessDomainEvent::dispatch() → Cola RabbitMQ "default"
    → Worker (php artisan queue:work) consume el mensaje
    → ProcessDomainEvent::handle() → Procesa / Loguea el evento
```

**Evento:** [`enso-crm/app/Events/GameSessionStarted.php`](enso-crm/app/Events/GameSessionStarted.php)

```php
// Datos que lleva el evento
public function __construct(
    public int    $userId,
    public string $gameType,
    public string $sessionId,
) {}
```

**Listener:** [`enso-crm/app/Listeners/PublishGameSessionToRabbitMQ.php`](enso-crm/app/Listeners/PublishGameSessionToRabbitMQ.php)

```php
public function handle(GameSessionStarted $event): void
{
    ProcessDomainEvent::dispatch([
        'event'     => 'GameSessionStarted',
        'userId'    => $event->userId,
        'gameType'  => $event->gameType,
        'sessionId' => $event->sessionId,
        'timestamp' => now()->toISOString(),
    ])->onConnection('rabbitmq');
}
```

**Job:** [`enso-crm/app/Jobs/ProcessDomainEvent.php`](enso-crm/app/Jobs/ProcessDomainEvent.php)

**Configuración de la cola:** [`enso-crm/config/queue.php`](enso-crm/config/queue.php)

```php
'rabbitmq' => [
    'driver' => 'rabbitmq',
    'queue'  => env('RABBITMQ_QUEUE', 'default'),
    'hosts'  => [[
        'host'     => env('RABBITMQ_HOST', '127.0.0.1'),
        'port'     => env('RABBITMQ_PORT', 5672),
        'user'     => env('RABBITMQ_USER', 'guest'),
        'password' => env('RABBITMQ_PASSWORD', 'guest'),
        'vhost'    => env('RABBITMQ_VHOST', '/'),
    ]],
],
```

**Registro del listener:** [`enso-crm/app/Providers/AppServiceProvider.php`](enso-crm/app/Providers/AppServiceProvider.php)

```php
Event::listen(GameSessionStarted::class, PublishGameSessionToRabbitMQ::class);
```

**Panel de administración de RabbitMQ:** `http://localhost:15672` (usuario: `guest`, password: `guest`)

**Para consumir la cola:**

```bash
php artisan queue:work rabbitmq
```

---

## 9. MCP — ¿Cuál es la ventaja de tenerlo y cuál es la arquitectura actual?

### ¿Qué es MCP (Model Context Protocol)?

MCP es un protocolo estándar de Anthropic que permite a modelos de IA (como Claude) conectarse a herramientas y sistemas externos. En lugar de copiar-pegar contexto manualmente, Claude puede **leer y actuar sobre sistemas reales directamente**.

### Configuración actual: [`enso-crm/.claude/settings.json`](enso-crm/.claude/settings.json)

Se han configurado **2 servidores MCP**:

#### 1. GitHub MCP Server

```json
{
  "command": "docker",
  "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
            "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests",
            "ghcr.io/github/github-mcp-server"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

- Permite a Claude leer issues, pull requests y repositorios de GitHub
- **Ventaja práctica:** Claude puede crear issues automáticamente, revisar PRs en contexto, o navegar el histórico de cambios sin salir del editor

#### 2. RabbitMQ MCP Server

```json
{
  "command": "uvx",
  "args": ["amq-mcp-server-rabbitmq@latest", "--allow-mutative-tools"],
  "env": {
    "RABBITMQ_URL": "amqp://guest:guest@localhost:5672/"
  }
}
```

- Permite a Claude monitorizar colas, ver mensajes pendientes y gestionar exchanges de RabbitMQ
- **Ventaja práctica:** Durante el desarrollo, Claude puede inspeccionar si los mensajes llegan correctamente a la cola sin abrir el panel web de RabbitMQ

### ¿Cuál es la ventaja de esta arquitectura?

Con MCP, Claude Code actúa como un **asistente que tiene visibilidad real del estado del sistema**, no solo del código:

- Puede ver si hay mensajes atascados en RabbitMQ mientras ayuda a depurar
- Puede crear issues de GitHub directamente al encontrar un bug
- No requiere cambios en el código de producción para conectar herramientas

---

## 10. Problemas encontrados durante el proyecto y cómo se solucionaron

### Problema 1: Threshold de DeepFace demasiado estricto

**Problema:** El reconocimiento facial rechazaba caras legítimas. El threshold por defecto de DeepFace con VGG-Face es 0.68 (cosine), que resultaba demasiado exigente con diferencias de iluminación o ángulo.

**Solución:** Se configuró un threshold personalizado de 0.5 directamente en el microservicio Python, que permite variaciones razonables manteniendo seguridad.

```python
# enso-crm/microservicio_facial/main.py
CUSTOM_THRESHOLD = 0.5  # Más permisivo que el 0.68 por defecto
verified = result["distance"] < CUSTOM_THRESHOLD
```

### Problema 2: Conexión de Reverb al contenedor de base de datos

**Problema:** El contenedor `reverb` no podía conectarse a PostgreSQL usando `DB_HOST=127.0.0.1` porque dentro de Docker cada contenedor es una red separada.

**Solución:** En `docker-compose.yml`, se sobreescribió `DB_HOST` con el nombre del servicio Docker (`db`) y se usó el puerto interno (`5432`), no el mapeado al host (`5434`).

```yaml
# enso-crm/docker-compose.yml
reverb:
  environment:
    DB_HOST: db      # Nombre del servicio, resuelto por DNS interno de Docker
    DB_PORT: 5432    # Puerto interno del contenedor de PostgreSQL
```

### Problema 3: Dependencias de sistema para OpenCV en el contenedor Python

**Problema:** DeepFace usa OpenCV internamente, que requiere librerías de sistema (`libgl1`, `libglib2.0-0`, etc.) no presentes en `python:3.10-slim`.

**Solución:** Se añadieron explícitamente en el Dockerfile del microservicio:

```dockerfile
# enso-crm/microservicio_facial/Dockerfile
RUN apt-get update && apt-get install -y \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev gcc g++
```

### Problema 4: Conflicto de versiones numpy/pandas con DeepFace

**Problema:** Las últimas versiones de numpy y pandas son incompatibles con DeepFace 0.0.93. La instalación sin versiones fijas fallaba con errores de importación.

**Solución:** Fijar versiones compatibles antes de instalar el resto de dependencias:

```dockerfile
RUN pip install numpy==1.26.4 && \
    pip install pandas==2.2.2 && \
    pip install -r requirements.txt
```

### Problema 5: CORS en el microservicio facial

**Problema:** Las peticiones desde el frontend al microservicio FastAPI eran bloqueadas por CORS en producción.

**Solución:** Se configuró CORS en FastAPI restringido únicamente al dominio de producción:

```python
# enso-crm/microservicio_facial/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://enso-lite.duckdns.org"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 11. Preguntas adicionales importantes

### ¿Qué roles existen en el sistema y cómo se aplica el control de acceso?

Existen 3 roles: `admin`, `gestor` y `player`. El rol se guarda como ENUM en la columna `role` de la tabla `users`.

El control de acceso se aplica mediante **middleware de Laravel**. Las rutas están agrupadas por rol en [`enso-crm/routes/web.php`](enso-crm/routes/web.php):

```php
Route::middleware(['auth', 'role:admin'])->group(function () {
    // Rutas solo para admin
});
Route::middleware(['auth', 'role:player'])->group(function () {
    // Rutas solo para jugadores
});
```

### ¿Qué es Caddy y por qué se usa como reverse proxy?

Caddy es un servidor web moderno configurado en [`enso-crm/Caddyfile`](enso-crm/Caddyfile). Actúa como **puerta de entrada única** al sistema:

- Termina HTTPS automáticamente (genera y renueva certificados TLS sin configuración manual)
- Redirige el tráfico a los servicios internos (Laravel, Reverb, etc.)
- Añade headers de seguridad
- El dominio público `enso-lite.duckdns.org` apunta a este contenedor

### ¿Por qué el microservicio de reconocimiento facial es Python y no PHP?

DeepFace y las librerías de visión por computador del ecosistema (OpenCV, TensorFlow) son nativas de Python y no tienen equivalente maduro en PHP. Separarlo como microservicio independiente permite:

1. Usar el lenguaje más adecuado para cada tarea
2. Escalar el microservicio independientemente
3. Actualizar las dependencias de IA sin tocar la aplicación principal

### ¿Qué es Laravel Sanctum y para qué se usa aquí?

Sanctum es el sistema de autenticación por tokens de Laravel. Se usa para proteger las rutas de la API interna (`/api/*`) que consume el microservicio facial. La tabla `personal_access_tokens` fue creada por la migración `2026_03_23_182607`.

### ¿Cómo se almacenan las fotos de reconocimiento facial de forma segura?

Las fotos se guardan en el **disco privado** de Laravel (`storage/app/private/faces/{user_id}.jpg`), que no es accesible públicamente desde el navegador. Solo se puede acceder a través de un endpoint autenticado de Laravel que verifica permisos antes de servir el archivo.

```php
// enso-crm/app/Http/Controllers/Api/FaceController.php
public function enroll(Request $request): JsonResponse {
    $path = $request->file('photo')->storeAs(
        'faces', $user->id . '.jpg', 'private'
    );
    $user->update(['face_photo' => $path]);
}
```

### ¿Qué diferencia hay entre `ShouldBroadcast` y `ShouldBroadcastNow`?

- `ShouldBroadcast`: El evento se mete en la cola de trabajo (asíncrono, requiere un worker corriendo)
- `ShouldBroadcastNow`: El evento se emite **inmediatamente** de forma síncrona, sin necesidad de worker

El chat usa `ShouldBroadcastNow` porque los mensajes deben aparecer en tiempo real, sin demora.

```php
// enso-crm/app/Events/MessageSent.php
class MessageSent implements ShouldBroadcastNow  // ← Inmediato, sin cola
```

### ¿Cómo funciona Inertia sin SPA tradicional? ¿Qué lo hace diferente de una API REST + React?

Con una API REST tradicional, tienes dos aplicaciones separadas: el backend devuelve JSON y el frontend hace fetch. Con Inertia:

- **No hay endpoints JSON públicos** para las páginas — el controlador devuelve directamente el componente React con sus props
- **El enrutamiento lo gestiona el servidor** (Laravel), no React Router
- **La primera carga** es HTML completo (mejor SEO, sin flash de contenido vacío)
- **Las navegaciones posteriores** son peticiones XHR que devuelven solo el nombre del componente + props en JSON, sin recargar la cabecera/layout

Esto se llama **monolito de pila completa** (full-stack monolith) en contraposición a la arquitectura desacoplada.

---

## Resumen de archivos clave

| Pregunta | Archivo principal |
|---|---|
| Inertia → React | [`resources/js/app.tsx`](enso-crm/resources/js/app.tsx) + controladores en `app/Http/Controllers/` |
| Crear BD | [`database/migrations/`](enso-crm/database/migrations/) |
| Llenar BD | [`database/seeders/DatabaseSeeder.php`](enso-crm/database/seeders/DatabaseSeeder.php) |
| Conectar BD | [`config/database.php`](enso-crm/config/database.php) + [`.env`](enso-crm/.env) |
| Docker | [`docker-compose.yml`](enso-crm/docker-compose.yml) + Dockerfiles |
| Reconocimiento facial | [`microservicio_facial/main.py`](enso-crm/microservicio_facial/main.py) |
| Chat WebSockets | [`app/Events/MessageSent.php`](enso-crm/app/Events/MessageSent.php) + [`routes/channels.php`](enso-crm/routes/channels.php) |
| RabbitMQ | [`app/Jobs/ProcessDomainEvent.php`](enso-crm/app/Jobs/ProcessDomainEvent.php) + [`config/queue.php`](enso-crm/config/queue.php) |
| MCP | [`.claude/settings.json`](enso-crm/.claude/settings.json) |
