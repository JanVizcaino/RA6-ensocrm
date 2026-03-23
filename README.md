# ENSO CRM

**Autor:** Jan Vizcaíno  
**Versión:** 1.0.0  
**Stack:** Laravel 12 · Inertia.js · React · TypeScript · PostgreSQL

---

## Descripción

ENSO CRM es una plataforma de gestión de juegos cognitivos orientada a centros educativos. Permite a administradores y gestores publicar y administrar juegos interactivos, y a los jugadores acceder a ellos desde una interfaz gamificada. El sistema está construido sobre una arquitectura Laravel + Inertia + React, con una API REST separada para la comunicación entre el juego y el servidor.

---

## Tecnologías utilizadas

| Tecnología | Versión | Función en el sistema |
|---|---|---|
| Laravel | 12 | Framework backend: rutas, autenticación, ORM, middleware y lógica de negocio |
| Inertia.js | 2.x | Puente entre Laravel y React. Elimina la necesidad de una API separada para las vistas |
| React | 19 | Librería de interfaz de usuario. Gestiona todas las vistas del CRM |
| TypeScript | 5.x | Tipado estático en el frontend para mayor robustez y mantenibilidad |
| PostgreSQL | 16 | Base de datos relacional principal |
| Tailwind CSS | 4.x | Estilos utilitarios para la interfaz |
| Vite | 7.x | Bundler y servidor de desarrollo para los assets del frontend |
| Laravel Sanctum | 4.x | Autenticación de la API REST mediante cookies de sesión |
| Three.js | r183 | Renderizado 3D para el juego Wisconsin Card Sorting |
| Ziggy | 2.x | Permite usar las rutas nombradas de Laravel directamente en React |

---

## Arquitectura del proyecto

El proyecto sigue una arquitectura **monolítica con separación de capas**:

```
┌─────────────────────────────────────────────────┐
│                   Navegador                     │
│         React + TypeScript (Inertia)            │
└────────────────────┬────────────────────────────┘
                     │ HTTP / Inertia / fetch
┌────────────────────▼────────────────────────────┐
│                  Laravel 12                     │
│                                                 │
│  routes/web.php   →   Vistas (Inertia)          │
│  routes/api.php   →   JSON (Sanctum)            │
│                                                 │
│  Middleware: auth, role:admin|gestor|player     │
│  Controllers: Admin/, Player/, Api/, Auth/      │
│  Models: User, Game                             │
└────────────────────┬────────────────────────────┘
                     │ Eloquent ORM
┌────────────────────▼────────────────────────────┐
│              PostgreSQL                         │
│  users · enso_games · enso_users_games          │
└─────────────────────────────────────────────────┘
```

### Separación web.php / api.php

Las rutas están estrictamente separadas en dos archivos:

- **`routes/web.php`** — rutas que devuelven vistas Inertia (HTML). Protegidas por sesión y middleware de rol.
- **`routes/api.php`** — rutas que devuelven JSON puro. Protegidas por Laravel Sanctum usando la cookie de sesión (`statefulApi`). El juego se comunica exclusivamente con esta capa.

```
Juego (Three.js) → postMessage → Play.tsx → fetch /api/games/{id}/finish → api.php → JSON
```

---

## Base de datos

### Tablas principales

#### `users`
Tabla de autenticación y gestión de usuarios. Extiende la tabla base de Laravel.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint | Clave primaria |
| name | varchar | Nombre del usuario |
| email | varchar | Email único, usado para login |
| password | varchar | Hash bcrypt |
| role | enum | Rol del usuario: `admin`, `gestor` o `player` |
| created_at / updated_at | timestamp | Gestión automática de Laravel |
| deleted_at | timestamp | Soft delete |

#### `enso_games`
Catálogo de juegos del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint | Clave primaria |
| name | varchar | Nombre del juego (único) |
| description | text | Descripción del juego |
| path | varchar | Identificador del componente React del juego |
| is_published | boolean | Si es visible para los jugadores |
| created_at / updated_at | timestamp | Gestión automática de Laravel |

#### `enso_users_games`
Registro de partidas jugadas. Relaciona usuarios con juegos.

| Campo | Tipo | Descripción |
|---|---|---|
| id | bigint | Clave primaria |
| user_id | bigint | FK → users |
| game_id | bigint | FK → enso_games |
| num_errors | integer | Número de errores en la partida |
| duration | integer | Duración en segundos (opcional) |
| result | json | Datos adicionales de resultado en formato flexible |
| played_at | timestamp | Fecha y hora de la partida |

### Relaciones Eloquent

```php
// User → juegos jugados (muchos a muchos con pivot)
User::belongsToMany(Game::class, 'enso_users_games')
    ->withPivot('num_errors', 'duration', 'result', 'played_at');

// Game → usuarios que lo han jugado
Game::belongsToMany(User::class, 'enso_users_games')
    ->withPivot('num_errors', 'duration', 'result', 'played_at');
```

---

## Autenticación

El sistema usa **Laravel Breeze** como base, adaptado a Inertia + React. No se usa MSAL ni OAuth externo — la autenticación es mediante email y contraseña.

### Flujo de autenticación

1. El usuario accede a `/login` o `/register`.
2. Laravel valida las credenciales y crea la sesión.
3. Tras el login, el sistema redirige según el rol:
   - `admin` o `gestor` → `/admin/dashboard`
   - `player` → `/player/dashboard`
4. Cada petición posterior es autenticada mediante la cookie de sesión de Laravel.

### Registro

El registro público está disponible en `/register`. Los usuarios registrados reciben el rol `player` por defecto. Solo un administrador puede cambiar el rol de un usuario desde el panel de gestión.

---

## Roles y permisos

El sistema implementa tres roles mediante un campo `enum` en la tabla `users` y un middleware personalizado (`CheckRole`):

| Rol | Acceso |
|---|---|
| `admin` | Panel completo: gestión de juegos y usuarios |
| `gestor` | Panel de juegos únicamente (sin acceso a usuarios) |
| `player` | Zona de juego: lista y ejecución de juegos publicados |

### Implementación del middleware

```php
// app/Http/Middleware/CheckRole.php
public function handle(Request $request, Closure $next, string ...$roles): mixed
{
    if (!$request->user() || !in_array($request->user()->role, $roles)) {
        abort(403, 'No autorizado.');
    }
    return $next($request);
}
```

El middleware acepta uno o varios roles, permitiendo construcciones como `role:admin,gestor` en las rutas.

---

## Gestión de juegos

El modelo `Game` representa un juego en el catálogo. Los campos principales son:

- `name` — título del juego
- `description` — descripción
- `path` — identificador del componente React que implementa el juego
- `is_published` — controla la visibilidad para los jugadores

El panel de administración permite realizar el CRUD completo: crear, editar, publicar/despublicar y eliminar juegos. El acceso a estas rutas está protegido por `role:admin,gestor`, impidiendo que un jugador acceda aunque conozca la URL.

---

## Experiencia del jugador y comunicación con la API

El jugador ve únicamente los juegos con `is_published = true`, filtrados por Laravel antes de llegar al frontend.

Al iniciar un juego, el componente React ocupa toda la pantalla. Cuando la partida termina, el juego emite un evento `postMessage`:

```javascript
window.parent.postMessage({
    type: 'GAME_OVER',
    payload: { errors: 13, duration: null }
}, '*');
```

La página `Play.tsx` escucha este evento y realiza una llamada `fetch` a la API:

```
POST /api/games/{id}/finish
Authorization: cookie de sesión (Sanctum statefulApi)
Content-Type: application/json

{ "errors": 13, "duration": null }
```

Laravel valida la petición, guarda el resultado en `enso_users_games` y devuelve un JSON de confirmación. El frontend redirige al dashboard y muestra un modal con los resultados.

---

## Instalación y puesta en marcha

### Requisitos

- PHP 8.2+
- Composer
- Node.js 20+
- PostgreSQL 14+

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd enso-crm

# 2. Instalar dependencias PHP
composer install

# 3. Instalar dependencias JavaScript
npm install

# 4. Configurar el entorno
cp .env.example .env
php artisan key:generate

# 5. Configurar la base de datos en .env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=enso_crm
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña

# 6. Ejecutar migraciones y datos de prueba
php artisan migrate --seed

# 7. Iniciar el servidor de desarrollo
php artisan serve

# 8. En otra terminal, compilar el frontend
npm run dev
```

### Usuarios de prueba (seeder)

| Email | Contraseña | Rol |
|---|---|---|
| admin@enso.com | password123 | admin |
| gestor@enso.com | password123 | gestor |
| jugador@enso.com | password123 | player |

---

## Estructura de carpetas relevante

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/         # GameController, UserController
│   │   ├── Api/           # GameController (devuelve JSON)
│   │   ├── Auth/          # Login, Register
│   │   └── Player/        # GameController (vistas del jugador)
│   └── Middleware/
│       ├── CheckRole.php
│       └── HandleInertiaRequests.php
├── Models/
│   ├── User.php
│   └── Game.php
routes/
├── web.php                # Rutas de vistas (Inertia)
├── api.php                # Rutas de API (JSON, Sanctum)
└── auth.php               # Login, logout, registro
resources/js/
├── Components/
│   ├── games/             # CardSortingGame3D.tsx
│   ├── layout/            # Header, Sidebar
│   ├── shared/            # Componentes reutilizables
│   └── ui/                # Componentes base
├── Layouts/
│   ├── MainLayout.tsx     # Layout con sidebar (admin/gestor)
│   └── GamifiedLayout.tsx # Layout sin sidebar (player)
├── Pages/
│   ├── Admin/             # Games, Users, Dashboard, Play
│   ├── Auth/              # Login, Register
│   └── Player/            # Index, Play
└── types/
    └── index.ts           # Tipos globales TypeScript
```
