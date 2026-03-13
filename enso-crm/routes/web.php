<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserController;
use Inertia\Inertia;

// 1. EL SEMÁFORO MAESTRO
Route::get('/', function (Request $request) {
    if (!$request->user()) {
        return redirect()->route('login');
    }

    $roleName = $request->user()->role->name ?? null;

    if ($roleName === 'Jugador') {
        return redirect()->route('player.dashboard');
    }

    return redirect()->route('admin.dashboard');
});


// ==============================================================================
// 2. RUTAS DE ADMINISTRACIÓN (Protegidas SOLO para Admin y Gestor)
// ==============================================================================
// Añadimos 'role:Admin,Gestor' al middleware array
Route::middleware(['auth', 'verified', 'role:Admin,Gestor'])->prefix('admin')->group(function () {
    
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');

Route::get('/users', [UserController::class, 'index'])->name('admin.users');

    Route::get('/exercises', function () {
        return Inertia::render('Admin/Exercises');
    })->name('admin.exercises');

    Route::get('/collections', function () {
        return Inertia::render('Admin/Collections');
    })->name('admin.collections');

});


// ==============================================================================
// 3. RUTAS DE JUGADORES (Protegidas SOLO para Jugadores)
// ==============================================================================
// Añadimos 'role:Jugador' al middleware array
Route::middleware(['auth', 'verified', 'role:Jugador'])->prefix('player')->group(function () {
    
    Route::get('/dashboard', function () {
        return Inertia::render('Player/Dashboard');
    })->name('player.dashboard');

});


require __DIR__.'/auth.php';