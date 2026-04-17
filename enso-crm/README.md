<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

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
```

El navegador nunca se comunica directamente con el microservicio Python. Toda decisión de acceso y seguridad la toma Laravel.

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

# Microservicio facial (Docker)
docker-compose up -d
```

### Variable de entorno del microservicio

```env
FACIAL_SERVICE_URL=http://127.0.0.1:8181/verify
```

---

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).