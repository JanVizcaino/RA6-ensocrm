<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\GameController as AdminGameController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Player\GameController as PlayerGameController;

Route::get('/', function (Request $request) {
    if (!$request->user()) {
        return redirect()->route('login');
    }
    return $request->user()->isPlayer()
        ? redirect()->route('player.dashboard')
        : redirect()->route('admin.dashboard');
});

// ==============================================================================
// ADMIN + GESTOR
// ==============================================================================
Route::middleware(['auth', 'role:admin,gestor'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        Route::get('/dashboard', function () {
            return Inertia::render('Admin/Dashboard');
        })->name('dashboard');

        Route::get('/games',           [AdminGameController::class, 'index'])->name('games.index');
        Route::post('/games',          [AdminGameController::class, 'store'])->name('games.store');
        Route::get('/games/{id}/play', [AdminGameController::class, 'play'])->name('games.play');
        Route::put('/games/{id}',      [AdminGameController::class, 'update'])->name('games.update');
        Route::delete('/games/{id}',   [AdminGameController::class, 'destroy'])->name('games.destroy');
    });

// ==============================================================================
// SOLO ADMIN
// ==============================================================================
Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        Route::get('/users',           [AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users',          [AdminUserController::class, 'store'])->name('users.store');
        Route::put('/users/{id}',      [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{id}',   [AdminUserController::class, 'destroy'])->name('users.destroy');
    });

// ==============================================================================
// PLAYER
// ==============================================================================
Route::middleware(['auth', 'role:player'])
    ->prefix('player')
    ->name('player.')
    ->group(function () {

        Route::get('/dashboard',            [PlayerGameController::class, 'index'])->name('dashboard');
        Route::get('/games/{id}/play',      [PlayerGameController::class, 'play'])->name('games.play');
        Route::post('/games/{id}/finish',   [PlayerGameController::class, 'finish'])->name('games.finish');
    });

require __DIR__ . '/auth.php';