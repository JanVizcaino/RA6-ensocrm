# STUDY.md — Guía de defensa del proyecto ENSO CRM

> Referencia rápida para la evaluación oral. Cada respuesta incluye el archivo exacto, el fragmento de código y una explicación de qué hace cada parte y en qué momento del flujo ocurre.

---

## 1. ¿A través de qué archivo Inertia le manda los datos a React?

Tu comprensión es correcta: hay dos piezas que trabajan juntas. El flujo completo paso a paso:

---

**Paso 1 — El usuario navega a una URL y Laravel la enruta al controlador**

```php
// enso-crm/routes/web.php
// Cuando el usuario visita /admin/games, Laravel sabe qué controlador llamar
Route::get('/admin/games', [GameController::class, 'index']);
// ↑ web.php es el mapa de rutas. Sin él, Laravel no sabe qué hacer con la URL
```

---

**Paso 2 — El controlador carga los datos y llama a Inertia::render()**

```php
// enso-crm/app/Http/Controllers/Admin/GameController.php
public function index()
{
    $games = Game::all(); // Consulta Eloquent a la BD — obtiene los juegos

    return Inertia::render('Admin/Games', [
        'games' => $games,
        // ↑ 'Admin/Games' es el nombre del componente React a cargar
        // El array es la "mochila de datos" que viajará como props al frontend
        // Inertia serializa $games a JSON automáticamente
    ]);
}
```

Otros ejemplos de render con sus props:

```php
// enso-crm/app/Http/Controllers/Player/GameController.php
return Inertia::render('Player/Index', ['games'       => $games]);
return Inertia::render('Player/Play',  ['game'        => $game]);
return Inertia::render('/History',     ['userHistory' => $history]);

// enso-crm/app/Http/Controllers/Auth/AuthenticatedSessionController.php
return Inertia::render('Auth/Login', [
    'canResetPassword' => Route::has('password.request'),
    'status'           => session('status'), // ej: "Contraseña actualizada"
]);
```

---

**Paso 3 — Inertia construye la respuesta y la envía al navegador**

- **Primera visita:** Inertia devuelve un HTML completo con los props embebidos en un `data-page` attribute del div `#app`. React arranca desde ese HTML — no hay pantalla en blanco.
- **Navegaciones siguientes:** Inertia hace una petición XHR. El servidor devuelve solo el nombre del componente + props en JSON. La cabecera/layout no se recarga.

---

**Paso 4 — `app.tsx` recibe la respuesta y resuelve qué componente montar**

```tsx
// enso-crm/resources/js/app.tsx — Se ejecuta una sola vez al cargar el navegador
createInertiaApp({
    resolve: (name) => {
        // `name` es el string que mandó el servidor: "Admin/Games", "Player/Index"...
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        return pages[`./Pages/${name}.tsx`];
        // ↑ Busca el archivo Pages/Admin/Games.tsx y lo devuelve para montarlo
        // Vite ya tiene todos los componentes pre-cargados gracias al glob
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
        // ↑ Monta React en el div #app del HTML
        // `props` incluye los datos que mandó el controlador PHP
    },
});
```

---

**Paso 5 — El componente React recibe los props y renderiza**

```tsx
// enso-crm/resources/js/Pages/Player/Index.tsx
// Los props llegan como parámetros del componente — no hay ningún fetch() manual
export default function Index({ games }: { games: Game[] }) {
    // `games` es exactamente el array que devolvió Game::all() en el controlador
    // TypeScript garantiza que el shape del objeto es correcto
    return <div>{games.map(g => <GameCard key={g.id} game={g} />)}</div>;
}
```

### Resumen visual del flujo:

```
[Usuario visita /admin/games]
         ↓
   web.php → GameController::index()
         ↓
   Game::all() → consulta PostgreSQL
         ↓
   Inertia::render('Admin/Games', ['games' => $games])
         ↓
   Respuesta HTTP (HTML completo en primera visita / JSON en navegaciones)
         ↓
   app.tsx → resolve('Admin/Games') → Pages/Admin/Games.tsx
         ↓
   React monta el componente con props = { games: [...] }
         ↓
   [UI renderizada — sin ningún fetch() en el frontend]
```

**¿Qué hace Inertia diferente a una API REST + React?**
- En una SPA clásica: frontend hace `fetch('/api/games')` → recibe JSON → renderiza
- Con Inertia: el controlador ya incluye los datos en la respuesta. No hay endpoints JSON públicos para las páginas. El enrutamiento lo gestiona Laravel (`web.php`), no React Router.

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
    $table->string('path');              // Ruta al bundle Three.js del juego
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
# O para empezar desde cero:
php artisan migrate:fresh --seed
```

---

## 3. ¿Cómo se llena la base de datos?

Mediante **seeders**, ejecutando `php artisan db:seed`.

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

Game::create([
    'name'         => 'Wisconsin 3D',
    'description'  => 'Card Sorting Game',
    'path'         => 'wisconsin3d',
    'is_published' => true,
]);
```

**Factory:** [`enso-crm/database/factories/UserFactory.php`](enso-crm/database/factories/UserFactory.php) — Para generar usuarios de prueba masivos con `User::factory()->count(10)->create()`.

---

## 4. ¿Cómo se conecta a la base de datos?

**Motor:** PostgreSQL 15 (contenedor Docker `db`)

**Configuración en `.env`:** [`enso-crm/.env`](enso-crm/.env)

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5434          # Puerto externo (el contenedor expone 5432 como 5434 en el host)
DB_DATABASE=enso_lite_db
DB_USERNAME=enso_lite_user
DB_PASSWORD=secret
```

**Archivo de configuración:** [`enso-crm/config/database.php`](enso-crm/config/database.php)

```php
// Laravel lee el .env y configura el driver de base de datos
'default' => env('DB_CONNECTION', 'pgsql'),

'pgsql' => [
    'driver'      => 'pgsql',
    'host'        => env('DB_HOST', '127.0.0.1'),
    'port'        => env('DB_PORT', '5432'),
    'database'    => env('DB_DATABASE', 'forge'),
    'username'    => env('DB_USERNAME', 'forge'),
    'password'    => env('DB_PASSWORD', ''),
    'sslmode'     => 'prefer',
    'search_path' => 'public',
],
```

**En Docker Compose**, el servicio Reverb se conecta a la BD por nombre de servicio interno (`db`), no por `127.0.0.1`, porque dentro de la red Docker cada contenedor es su propio host:

```yaml
# enso-crm/docker-compose.yml
reverb:
  environment:
    DB_HOST: db        # Nombre del contenedor, resuelto por DNS interno de Docker
    DB_PORT: 5432      # Puerto interno (no el 5434 que ve el host)
```

**Laravel usa Eloquent ORM** para todas las operaciones. Los modelos están en [`enso-crm/app/Models/`](enso-crm/app/Models/). Ejemplo: `Game::all()`, `User::find($id)`, `Message::create([...])`.

---

## 5. Docker — ¿Para qué se usa, cómo se levanta, para qué sirve un Dockerfile?

### ¿Para qué se usa Docker en este proyecto?

Docker permite ejecutar todos los servicios (base de datos, microservicio Python, servidor WebSocket, proxy inverso...) de forma aislada y reproducible, sin instalar nada manualmente en el sistema operativo host.

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
docker compose up -d          # Levantar todos los servicios en background
docker compose logs -f        # Ver logs en tiempo real
docker compose down           # Parar todo
docker compose up -d --build  # Reconstruir imágenes y levantar
```

### ¿Para qué sirve un Dockerfile?

Un Dockerfile es una receta para construir una imagen Docker personalizada: define el sistema operativo base, las dependencias, el código y el comando de arranque.

**Dockerfile del microservicio facial:** [`enso-crm/microservicio_facial/Dockerfile`](enso-crm/microservicio_facial/Dockerfile)

```dockerfile
FROM python:3.10-slim          # Parte de una imagen Python ligera
WORKDIR /app                   # Todo ocurre en /app dentro del contenedor
RUN apt-get install -y libgl1 libglib2.0-0 ...
# ↑ DeepFace usa OpenCV que necesita estas librerías de sistema gráfico.
# Sin ellas, el import falla aunque pip haya instalado todo bien.

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt  # Instala las librerías Python
COPY main.py .
EXPOSE 5000                    # Documenta que el servicio escucha en el 5000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
# ↑ Arranca el servidor FastAPI cuando el contenedor inicia
```

**Dockerfile de Reverb (WebSocket):** [`enso-crm/docker/reverb/Dockerfile`](enso-crm/docker/reverb/Dockerfile)

```dockerfile
FROM php:8.2-cli
RUN apt-get install -y libpq-dev unzip git && \
    docker-php-ext-install pdo pdo_pgsql pcntl
# ↑ pdo_pgsql: driver para conectar PHP con PostgreSQL
# ↑ pcntl: extensión para manejar procesos Unix, necesaria para Reverb
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
```

---

## 6. Reconocimiento facial — ¿Qué librería se usa y en qué lenguaje?

Hay **dos sistemas de visión completamente separados** en este proyecto:

---

### Sistema 1: Verificación de identidad al hacer login (servidor Python)

**Librería:** DeepFace v0.0.93 | **Lenguaje:** Python | **Framework:** FastAPI

**Archivo principal:** [`enso-crm/microservicio_facial/main.py`](enso-crm/microservicio_facial/main.py)

**Flujo completo paso a paso:**

**Paso 1 — El admin registra la foto del usuario**

```
Admin sube foto del usuario → POST /api/face/enroll → FaceController::enroll()
```

```php
// enso-crm/app/Http/Controllers/Api/FaceController.php
// La foto se guarda en disco PRIVADO — no accesible desde el navegador directamente
$path = $request->file('photo')->storeAs('faces', $user->id . '.jpg', 'private');
// Guarda la ruta en la BD: storage/app/private/faces/42.jpg
$user->update(['face_photo' => $path]);
```

**Paso 2 — El usuario intenta hacer login con su cara**

```
Usuario escribe su email + captura webcam → POST /api/face/verify → FaceController::verify()
```

```php
// FaceController::verify() — Este controlador hace de intermediario
// 1. Busca al usuario por email para obtener la foto registrada
// 2. Coge la foto de la webcam (viene en base64 en el request)
// 3. Manda las DOS imágenes al microservicio Python
$response = Http::post('http://facial-api:5000/verify', [
    'img1' => base64_encode(Storage::disk('private')->get($user->face_photo)),
    'img2' => $request->input('image'), // foto webcam en base64
]);
// 4. Si verified=true, autentica al usuario
if ($response['verified']) {
    Auth::login($user);
}
```

**Paso 3 — El microservicio Python compara las dos caras**

```python
# enso-crm/microservicio_facial/main.py — Endpoint POST /verify
# Recibe las dos imágenes y las compara con DeepFace
result = DeepFace.verify(
    img1_path=img1_path,          # Foto registrada (la del admin)
    img2_path=img2_path,          # Foto de la webcam ahora mismo
    model_name="VGG-Face",        # Red neuronal entrenada en millones de caras
    detector_backend="opencv",    # Detecta dónde está la cara en la imagen
    distance_metric="cosine",     # Mide la similitud entre vectores de características
    enforce_detection=False,      # No falla si la imagen está algo torcida
)

CUSTOM_THRESHOLD = 0.5  # Si la distancia es < 0.5, es la misma persona
# El threshold por defecto de DeepFace es 0.68 — demasiado estricto con
# diferencias de iluminación, así que se bajó a 0.5
verified = result["distance"] < CUSTOM_THRESHOLD

return {
    "verified":  verified,           # true/false
    "distance":  result["distance"], # ej: 0.31 (muy parecido) o 0.72 (diferente)
    "threshold": CUSTOM_THRESHOLD,
    "model":     "VGG-Face",
}
```

**Requisitos Python:** [`enso-crm/microservicio_facial/requirements.txt`](enso-crm/microservicio_facial/requirements.txt)

---

### Sistema 2: Detección de emociones durante el juego (frontend TypeScript)

**Librería:** face-api.js v0.22.2 | **Lenguaje:** TypeScript | **Ejecuta en:** el navegador del usuario

Este sistema **no manda imágenes al servidor**, solo el nombre de la emoción y su confianza. Es un sistema completamente diferente al de verificación de identidad.

**Archivo:** [`enso-crm/resources/js/Pages/Player/Play.tsx`](enso-crm/resources/js/Pages/Player/Play.tsx)

**Flujo completo paso a paso:**

**Paso 1 — Al cargar el juego, se carga face-api.js dinámicamente desde CDN**

```typescript
// Play.tsx — Solo se carga cuando el usuario entra a jugar
async function loadFaceApi(): Promise<any> {
    if ((window as any).faceapi) return (window as any).faceapi; // ya cargado

    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        // Se inyecta el script dinámicamente — no va en el bundle de Vite
        // porque es una librería pesada que solo se usa aquí
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
    return (window as any).faceapi;
}
```

**Paso 2 — Se cargan los modelos de IA y se activa la webcam (en segundo plano)**

```typescript
// Play.tsx — Los modelos se descargan desde el CDN de face-api
await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
// ↑ TinyFaceDetector: modelo ligero para detectar DÓNDE está la cara

await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
// ↑ FaceExpressionNet: modelo para clasificar la emoción de esa cara

// Se activa la webcam silenciosamente (el usuario no ve el video)
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
```

**Paso 3 — Cada 3 segundos se analiza un frame de la webcam**

```typescript
// Play.tsx — Bucle de detección mientras el juego está activo
intervalRef.current = setInterval(async () => {
    // Analiza el frame actual del video
    const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
    // ↑ Devuelve un objeto con 7 emociones y sus probabilidades:
    // { neutral: 0.72, happy: 0.15, sad: 0.03, angry: 0.02, ... }

    if (!result) return; // No hay cara en pantalla, se salta este frame

    // Encuentra la emoción con mayor probabilidad
    const expressions = result.expressions as Record<string, number>;
    const [emotion, confidence] = Object.entries(expressions)
        .reduce((a, b) => (b[1] > a[1] ? b : a));
    // ej: emotion = "neutral", confidence = 0.72

    // Envía al servidor solo el nombre de la emoción (NO la imagen)
    await fetch('/api/emotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrfToken() },
        body: JSON.stringify({
            user_game_id: userGameIdRef.current, // ID de esta sesión de juego
            emotion:      emotion,               // "neutral", "happy", "sad"...
            confidence:   parseFloat(confidence.toFixed(4)), // 0.7234
            recorded_at:  new Date().toISOString(),          // timestamp exacto
        }),
    });
}, 3000); // Cada 3 segundos
```

**Paso 4 — El servidor Laravel guarda la emoción en la base de datos**

```php
// enso-crm/app/Http/Controllers/Api/EmotionController.php
public function store(Request $request): JsonResponse
{
    // Valida que la emoción sea una de las 7 válidas y que el user_game_id exista
    $request->validate([
        'user_game_id' => 'required|integer|exists:enso_users_games,id',
        'emotion'      => 'required|string|in:neutral,happy,sad,angry,surprised,fearful,disgusted',
        'confidence'   => 'required|numeric|min:0|max:1',
        'recorded_at'  => 'required|date',
    ]);

    // Inserta directamente con Query Builder (más rápido que Eloquent para inserciones frecuentes)
    DB::table('enso_game_emotions')->insert([
        'user_game_id' => $request->user_game_id,
        'emotion'      => $request->emotion,
        'confidence'   => $request->confidence,
        'recorded_at'  => $request->recorded_at,
        'created_at'   => now(),
        'updated_at'   => now(),
    ]);

    return response()->json(['success' => true]);
}
```

**Tabla de emociones:** [`enso-crm/database/migrations/2026_03_12_173535_create_enso_game_emotions_table.php`](enso-crm/database/migrations/2026_03_12_173535_create_enso_game_emotions_table.php)

```php
Schema::create('enso_game_emotions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_game_id')->constrained('enso_users_games')->cascadeOnDelete();
    // ↑ Cada emoción pertenece a una sesión concreta de juego
    $table->string('emotion');           // "happy", "neutral", "sad"...
    $table->decimal('confidence', 5, 4); // 0.9850 — con 4 decimales
    $table->timestamp('recorded_at');    // Cuándo exactamente se detectó
    $table->timestamps();
});
```

**Tabla de sesiones de juego** (la que referencia `user_game_id`): [`enso-crm/database/migrations/2026_03_12_173531_create_enso_users_games_table.php`](enso-crm/database/migrations/2026_03_12_173531_create_enso_users_games_table.php)

```php
Schema::create('enso_users_games', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('game_id')->constrained('enso_games')->cascadeOnDelete();
    $table->integer('num_errors')->nullable();   // Errores cometidos
    $table->integer('duration')->nullable();     // Duración en segundos
    $table->json('result')->nullable();          // Resultado detallado
    $table->timestamp('played_at')->useCurrent();
    $table->timestamps();
});
```

---

## 7. Chat y WebSockets — ¿Para qué sirven y cómo se usan?

### ¿Por qué WebSockets y no HTTP normal?

HTTP es unidireccional: el cliente pide, el servidor responde y se cierra la conexión. Para un chat en tiempo real se necesita que el **servidor pueda enviar mensajes al cliente** sin que este lo pida. Los WebSockets mantienen una conexión persistente bidireccional abierta.

### Stack usado:

- **Servidor WebSocket:** Laravel Reverb (contenedor Docker propio)
- **Cliente frontend:** Laravel Echo (librería JS)
- **Configuración:** [`enso-crm/config/reverb.php`](enso-crm/config/reverb.php)

### Flujo completo de un mensaje de chat — con el código de cada paso:

---

**Paso 1 — El usuario escribe un mensaje y pulsa enviar**

```
Usuario escribe → POST /api-web/messages → MessageController::store()
```

El frontend hace un `fetch` o usa Axios para hacer POST al endpoint. Laravel recibe la petición.

---

**Paso 2 — El controlador guarda el mensaje y dispara el broadcast**

```php
// enso-crm/app/Http/Controllers/Api/MessageController.php
public function store(Request $request): JsonResponse
{
    // Crea el registro en la tabla `messages` de la base de datos
    $message = Message::create([
        'user_id' => $request->user()->id,
        'body'    => $request->input('body'),
    ]);

    // Dispara el evento de broadcast — Reverb lo enviará por WebSocket
    broadcast(new MessageSent($message->load('user')));
    // ↑ load('user') hace eager loading para que el evento incluya los datos del autor

    return response()->json(['success' => true]);
    // La respuesta HTTP vuelve al cliente — el mensaje ya está guardado Y emitido
}
```

---

**Paso 3 — El evento define QUÉ se envía y a QUÉ canal**

```php
// enso-crm/app/Events/MessageSent.php

// ShouldBroadcastNow = emite inmediatamente, sin cola, sin worker
// (ShouldBroadcast normal metería el evento en RabbitMQ y esperaría a un worker)
class MessageSent implements ShouldBroadcastNow
{
    public function broadcastOn(): array {
        return [new Channel('chat')];
        // ↑ Canal PÚBLICO llamado "chat" — cualquier cliente conectado lo recibe
        // Si fuera Canal privado sería: new PrivateChannel('chat')
    }

    public function broadcastWith(): array {
        // ↑ Define exactamente qué datos viajan por el WebSocket
        // Solo enviamos lo necesario, no el objeto Eloquent entero
        return [
            'id'         => $this->message->id,
            'body'       => $this->message->body,      // El texto del mensaje
            'created_at' => $this->message->created_at,
            'user'       => [
                'id'   => $this->message->user->id,
                'name' => $this->message->user->name,  // Para mostrar quién lo envió
                'role' => $this->message->user->role,  // Para estilos admin/player
            ],
        ];
    }
}
```

---

**Paso 4 — Los canales definen quién puede suscribirse a cada uno**

```php
// enso-crm/routes/channels.php

// Canal público "chat" — cualquier usuario autenticado puede escuchar
Broadcast::channel('chat', function () {
    return true; // Sin restricciones, acceso libre para autenticados
});

// Canal privado por usuario — solo el propio usuario puede escuchar SUS notificaciones
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
    // ↑ Verifica que el usuario logueado sea el dueño del canal
    // Nadie puede suscribirse al canal de otro usuario
});
```

---

**Paso 5 — El frontend establece la conexión WebSocket al arrancar**

```typescript
// enso-crm/resources/js/bootstrap.ts — Se ejecuta al cargar cualquier página
window.Echo = new Echo({
    broadcaster: 'reverb',                              // Usa el servidor Reverb
    key:         import.meta.env.VITE_REVERB_APP_KEY,  // Clave de autenticación del app
    wsHost:      import.meta.env.VITE_REVERB_HOST,     // Host del servidor WebSocket
    wsPort:      import.meta.env.VITE_REVERB_PORT,     // Puerto (8765)
    wssPort:     import.meta.env.VITE_REVERB_PORT,     // Puerto seguro (mismo en dev)
    forceTLS:    false,                                 // HTTP en local, HTTPS en prod
});
// ↑ Este objeto `Echo` queda disponible globalmente en toda la app React
// La conexión WebSocket se abre aquí y se mantiene abierta mientras el usuario navega
```

---

**Paso 6 — El componente React se suscribe al canal y actualiza la UI**

```typescript
// En el componente del chat (dentro de Player/Play.tsx o similar)

// Al montar el componente, se suscribe al canal "chat"
window.Echo.channel('chat')
    .listen('MessageSent', (e: { id: number; body: string; user: User; created_at: string }) => {
        // ↑ `e` contiene exactamente lo que definió broadcastWith() en el evento PHP
        // Este callback se ejecuta CADA VEZ que alguien envía un mensaje
        setMessages(prev => [...prev, e]);
        // ↑ Añade el nuevo mensaje al state de React → la UI se actualiza sola
    });

// Al desmontar el componente, se cancela la suscripción para evitar memory leaks
return () => {
    window.Echo.leave('chat');
};
```

### Resumen visual del flujo:

```
[Usuario A escribe]
       ↓
POST /api-web/messages → MessageController::store()
       ↓                         ↓
  BD: INSERT                broadcast(MessageSent)
  en messages                      ↓
                           Reverb (WebSocket server)
                                   ↓
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
           [Navegador Usuario B]        [Navegador Usuario C]
           Echo.listen('MessageSent')   Echo.listen('MessageSent')
                    ↓                             ↓
           setMessages([...e])          setMessages([...e])
                    ↓                             ↓
           [UI actualizada]             [UI actualizada]
```

---

## 8. RabbitMQ — ¿Para qué sirve y cómo se usa?

### ¿Qué es RabbitMQ?

RabbitMQ es un **message broker** (intermediario de mensajes). Permite que distintas partes de un sistema se comuniquen de forma asíncrona a través de colas. Un productor publica un mensaje en una cola y un consumidor lo procesa después, independientemente uno del otro.

### ¿Por qué se usa aquí?

Para **desacoplar el procesamiento de eventos de juego** del flujo principal HTTP. Cuando empieza una sesión de juego, en lugar de procesarlo síncronamente (bloqueando la respuesta), se publica un evento en RabbitMQ y un worker lo consume en segundo plano.

### Flujo completo de un evento de juego — con el código de cada paso:

---

**Paso 1 — El usuario inicia el juego y el controlador lanza el evento**

```php
// Desde el controlador de juego, al registrar el inicio de sesión
event(new GameSessionStarted(
    userId:    auth()->id(),       // ID del jugador actual
    gameType:  $game->path,        // ej: "wisconsin3d"
    sessionId: uniqid('session_'), // ID único para esta partida concreta
));
// ↑ `event()` es un helper de Laravel que dispara el evento
// Laravel busca automáticamente qué listeners están registrados para él
// La petición HTTP CONTINÚA — no espera a que el evento se procese
```

---

**Paso 2 — El evento encapsula los datos de la sesión**

```php
// enso-crm/app/Events/GameSessionStarted.php
class GameSessionStarted
{
    use Dispatchable, SerializesModels;
    // ↑ SerializesModels permite incluir modelos Eloquent que se serializan a JSON

    public function __construct(
        public readonly int    $userId,    // Quién juega
        public readonly string $gameType,  // Qué juego
        public readonly string $sessionId, // ID único de esta sesión
    ) {}
    // El evento es un simple contenedor de datos — no hace nada por sí solo
    // Su trabajo es ser "escuchado" por los listeners registrados
}
```

---

**Paso 3 — Laravel sabe a qué listener enrutar el evento (registro)**

```php
// enso-crm/app/Providers/AppServiceProvider.php
// Este mapeo evento → listener se define una sola vez al arrancar la app
Event::listen(GameSessionStarted::class, PublishGameSessionToRabbitMQ::class);
// ↑ Cuando se dispare GameSessionStarted, Laravel ejecuta PublishGameSessionToRabbitMQ
// Es el equivalente al routes/channels.php pero para eventos internos de PHP
```

---

**Paso 4 — El Listener recibe el evento y despacha el Job a RabbitMQ**

```php
// enso-crm/app/Listeners/PublishGameSessionToRabbitMQ.php
public function handle(GameSessionStarted $event): void
{
    ProcessDomainEvent::dispatch([
        // ↑ dispatch() no ejecuta el Job — lo serializa y lo mete en la cola
        'event'     => 'GameSessionStarted',
        'userId'    => $event->userId,
        'gameType'  => $event->gameType,
        'sessionId' => $event->sessionId,
        'timestamp' => now()->toISOString(), // Se añade aquí, no en el evento
    ])->onConnection('rabbitmq');
    // ↑ onConnection('rabbitmq') indica que el Job va a la cola de RabbitMQ
    // específicamente, no a la cola de base de datos u otro driver
    // El listener termina aquí — el usuario ya tiene su respuesta HTTP
}
```

---

**Paso 5 — RabbitMQ recibe el mensaje y lo encola**

El Job serializado llega al broker. RabbitMQ lo almacena en la cola `default` hasta que un worker lo recoja. Aquí entra en juego la configuración de la conexión:

```php
// enso-crm/config/queue.php
'rabbitmq' => [
    'driver' => 'rabbitmq',
    'queue'  => env('RABBITMQ_QUEUE', 'default'), // Nombre de la cola
    'hosts'  => [[
        'host'     => env('RABBITMQ_HOST', '127.0.0.1'),
        'port'     => env('RABBITMQ_PORT', 5672),  // Puerto AMQP estándar de RabbitMQ
        'user'     => env('RABBITMQ_USER', 'guest'),
        'password' => env('RABBITMQ_PASSWORD', 'guest'),
        'vhost'    => env('RABBITMQ_VHOST', '/'),  // Virtual host (partición lógica)
    ]],
],
```

---

**Paso 6 — Un worker consume el mensaje y ejecuta el Job**

```bash
php artisan queue:work rabbitmq
# ↑ Este proceso corre en segundo plano, escuchando la cola continuamente
```

```php
// enso-crm/app/Jobs/ProcessDomainEvent.php
class ProcessDomainEvent implements ShouldQueue // ← Marca que este Job va a cola
{
    use Queueable;

    public function __construct(
        public readonly string $event,   // "GameSessionStarted"
        public readonly array  $payload, // Los datos que mandó el listener
    ) {
        $this->onConnection('rabbitmq'); // Siempre a RabbitMQ, nunca a otro driver
        $this->onQueue(config('queue.connections.rabbitmq.queue', 'default'));
    }

    public function handle(): void
    {
        // Aquí se procesa el evento de forma asíncrona — el usuario ya está jugando
        // Actualmente loguea; en producción podría enviar analíticas, métricas, etc.
        \Log::info('[RabbitMQ] Domain event received', [
            'event'   => $this->event,
            'payload' => $this->payload,
        ]);
    }
}
```

### Resumen visual del flujo:

```
[Usuario inicia juego]
         ↓
GameController → event(new GameSessionStarted(...))
         ↓                              ↓
[Respuesta HTTP          AppServiceProvider: evento → listener
 al usuario]                            ↓
                         PublishGameSessionToRabbitMQ::handle()
                                        ↓
                         ProcessDomainEvent::dispatch()->onConnection('rabbitmq')
                                        ↓
                              [Cola RabbitMQ "default"]
                                        ↓
                         php artisan queue:work rabbitmq (worker en background)
                                        ↓
                         ProcessDomainEvent::handle() → Log / Analíticas
```

**Panel de administración de RabbitMQ:** `http://localhost:15672` (usuario: `guest`, password: `guest`) — Aquí se pueden ver los mensajes encolados en tiempo real.

---

## 9. MCP — ¿Cuál es la ventaja de tenerlo y cuál es la arquitectura actual?

### ¿Qué es MCP (Model Context Protocol)?

MCP es un protocolo estándar de Anthropic que permite a modelos de IA (como Claude) conectarse a herramientas y sistemas externos. En lugar de copiar-pegar contexto manualmente, Claude puede **leer y actuar sobre sistemas reales directamente**.

### Configuración actual: [`.claude/settings.json`](enso-crm/.claude/settings.json)

Se han configurado **2 servidores MCP**:

#### 1. GitHub MCP Server

```json
{
  "command": "docker",
  "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
            "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests",
            "ghcr.io/github/github-mcp-server"],
  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
}
```

Claude puede leer y crear issues, revisar PRs y navegar el repositorio directamente desde el editor, sin abrir GitHub en el navegador.

#### 2. RabbitMQ MCP Server

```json
{
  "command": "uvx",
  "args": ["amq-mcp-server-rabbitmq@latest", "--allow-mutative-tools"],
  "env": { "RABBITMQ_URL": "amqp://guest:guest@localhost:5672/" }
}
```

Claude puede monitorizar las colas de RabbitMQ, ver mensajes pendientes e inspeccionar si los eventos llegan correctamente, sin abrir el panel web.

### ¿Cuál es la ventaja de esta arquitectura?

Con MCP, Claude actúa como un asistente con **visibilidad real del estado del sistema**, no solo del código. Puede depurar un problema de cola viendo directamente los mensajes en RabbitMQ mientras analiza el código que los produce.

---

## 10. Problemas encontrados durante el proyecto y cómo se solucionaron

### Problema 1: Threshold de DeepFace demasiado estricto

**Problema:** El reconocimiento facial rechazaba caras legítimas. El threshold por defecto de DeepFace con VGG-Face es 0.68 (cosine), demasiado exigente con diferencias de iluminación o ángulo.

**Solución:** Threshold personalizado de 0.5 en el microservicio Python.

```python
# enso-crm/microservicio_facial/main.py
CUSTOM_THRESHOLD = 0.5  # Más permisivo que el 0.68 por defecto
verified = result["distance"] < CUSTOM_THRESHOLD
```

### Problema 2: Conexión de Reverb al contenedor de base de datos

**Problema:** El contenedor `reverb` no podía conectarse a PostgreSQL usando `DB_HOST=127.0.0.1` porque dentro de Docker cada contenedor es una red separada — `127.0.0.1` dentro de un contenedor es el propio contenedor, no el host.

**Solución:** En `docker-compose.yml`, `DB_HOST` apunta al nombre del servicio Docker:

```yaml
reverb:
  environment:
    DB_HOST: db      # Docker resuelve "db" al IP del contenedor de PostgreSQL
    DB_PORT: 5432    # Puerto interno (no el 5434 expuesto al host)
```

### Problema 3: Dependencias de sistema para OpenCV en el contenedor Python

**Problema:** `python:3.10-slim` no incluye librerías gráficas de sistema. DeepFace usa OpenCV que las necesita aunque solo procese imágenes sin mostrar nada.

**Solución:** Instaladas explícitamente en el Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev gcc g++
```

### Problema 4: Conflicto de versiones numpy/pandas con DeepFace

**Problema:** Las últimas versiones de numpy y pandas son incompatibles con DeepFace 0.0.93. La instalación sin versiones fijas fallaba con errores de importación en tiempo de ejecución.

**Solución:** Fijar versiones compatibles antes de instalar el resto:

```dockerfile
RUN pip install numpy==1.26.4 && \
    pip install pandas==2.2.2 && \
    pip install -r requirements.txt
```

### Problema 5: CORS en el microservicio facial

**Problema:** Las peticiones desde el frontend al microservicio FastAPI eran bloqueadas por CORS en producción, porque el navegador comprueba si el servidor autoriza el origen.

**Solución:** Middleware CORS en FastAPI restringido al dominio de producción:

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

### ¿Qué roles existen y cómo se aplica el control de acceso?

Existen 3 roles: `admin`, `gestor` y `player`. El rol se guarda como ENUM en la columna `role` de la tabla `users`.

El control de acceso se aplica mediante **middleware de Laravel** en [`enso-crm/routes/web.php`](enso-crm/routes/web.php):

```php
Route::middleware(['auth', 'role:admin'])->group(function () {
    // Rutas solo para admin — si un player intenta acceder, el middleware lo rechaza
});
Route::middleware(['auth', 'role:player'])->group(function () {
    // Rutas solo para jugadores
});
```

### ¿Qué es Caddy y por qué se usa como reverse proxy?

Caddy es un servidor web moderno configurado en [`enso-crm/Caddyfile`](enso-crm/Caddyfile). Actúa como **puerta de entrada única** al sistema: genera y renueva certificados HTTPS automáticamente, redirige el tráfico a los servicios internos (Laravel, Reverb), añade headers de seguridad. El dominio `enso-lite.duckdns.org` apunta a este contenedor.

### ¿Por qué el microservicio de reconocimiento facial es Python y no PHP?

DeepFace y las librerías de visión por computador (OpenCV, TensorFlow) son nativas de Python y no tienen equivalente maduro en PHP. Separarlo como microservicio independiente permite usar el lenguaje más adecuado para cada tarea, escalar el servicio de IA de forma independiente y actualizar sus dependencias sin tocar la aplicación principal.

### ¿Qué diferencia hay entre `ShouldBroadcast` y `ShouldBroadcastNow`?

- `ShouldBroadcast`: El evento se mete en la cola de trabajo (asíncrono, requiere un worker corriendo con `queue:work`)
- `ShouldBroadcastNow`: El evento se emite **inmediatamente** de forma síncrona, sin necesidad de worker

El chat usa `ShouldBroadcastNow` porque los mensajes deben aparecer en tiempo real sin demora, aunque el worker de cola no esté corriendo.

### ¿Cómo funciona Inertia? ¿Qué lo diferencia de API REST + React?

Con una API REST tradicional hay dos aplicaciones separadas: el backend devuelve JSON y el frontend hace fetch. Con Inertia:

- **No hay endpoints JSON públicos** para las páginas — el controlador devuelve directamente el componente React con sus props
- **El enrutamiento lo gestiona el servidor** (Laravel `web.php`), no React Router
- **La primera carga** es HTML completo (mejor SEO, sin flash de contenido vacío)
- **Las navegaciones posteriores** son peticiones XHR que devuelven solo el nombre del componente + props en JSON, sin recargar la cabecera/layout

Esto se llama **monolito de pila completa** (full-stack monolith).

### ¿Qué es Laravel Sanctum y para qué se usa aquí?

Sanctum es el sistema de autenticación por tokens de Laravel. Se usa para proteger las rutas de la API interna (`/api/*`). La tabla `personal_access_tokens` fue creada por la migración `2026_03_23_182607`.

---

## Resumen de archivos clave

| Pregunta | Archivo principal |
|---|---|
| Inertia → React | [`resources/js/app.tsx`](enso-crm/resources/js/app.tsx) + controladores en [`app/Http/Controllers/`](enso-crm/app/Http/Controllers/) |
| Crear BD | [`database/migrations/`](enso-crm/database/migrations/) |
| Llenar BD | [`database/seeders/DatabaseSeeder.php`](enso-crm/database/seeders/DatabaseSeeder.php) |
| Conectar BD | [`config/database.php`](enso-crm/config/database.php) + [`.env`](enso-crm/.env) |
| Docker | [`docker-compose.yml`](enso-crm/docker-compose.yml) + Dockerfiles |
| Verificación facial | [`microservicio_facial/main.py`](enso-crm/microservicio_facial/main.py) + [`app/Http/Controllers/Api/FaceController.php`](enso-crm/app/Http/Controllers/Api/FaceController.php) |
| Detección emociones | [`resources/js/Pages/Player/Play.tsx`](enso-crm/resources/js/Pages/Player/Play.tsx) + [`app/Http/Controllers/Api/EmotionController.php`](enso-crm/app/Http/Controllers/Api/EmotionController.php) |
| Chat WebSockets | [`app/Events/MessageSent.php`](enso-crm/app/Events/MessageSent.php) + [`routes/channels.php`](enso-crm/routes/channels.php) |
| RabbitMQ | [`app/Jobs/ProcessDomainEvent.php`](enso-crm/app/Jobs/ProcessDomainEvent.php) + [`config/queue.php`](enso-crm/config/queue.php) |
| MCP | [`.claude/settings.json`](enso-crm/.claude/settings.json) |
