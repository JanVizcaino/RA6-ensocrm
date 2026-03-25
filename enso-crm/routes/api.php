<?php

use App\Http\Controllers\Api\GameController as ApiGameController;
use App\Http\Controllers\Api\FaceController;
use Illuminate\Support\Facades\Route;

// Verificación facial — pública (no requiere auth, es el paso previo al login)
Route::post('/facial/verify', [FaceController::class, 'verify'])
    ->name('api.facial.verify')->middleware('web');

// Enrolamiento — requiere estar autenticado
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/facial/enroll', [FaceController::class, 'enroll'])
        ->name('api.facial.enroll')->middleware('web');

    Route::post('/games/{id}/finish', [ApiGameController::class, 'finish'])
        ->name('api.games.finish');

    Route::get('/games', [ApiGameController::class, 'index'])
        ->name('api.games.index');
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/games/{id}/finish', [ApiGameController::class, 'finish'])
        ->name('api.games.finish');

    Route::get('/games', [ApiGameController::class, 'index'])
        ->name('api.games.index');
});
