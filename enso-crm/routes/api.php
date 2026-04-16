<?php

use App\Http\Controllers\Api\GameController as ApiGameController;
use App\Http\Controllers\Api\FaceController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\EmotionController;
use Illuminate\Support\Facades\Route;

// Verificación facial — pública
Route::post('/facial/verify', [FaceController::class, 'verify'])
    ->name('api.facial.verify')
    ->middleware('web');

// Rutas autenticadas
Route::middleware(['auth:sanctum'])->group(function () {

    // Facial
    Route::post('/facial/enroll', [FaceController::class, 'enroll'])
        ->name('api.facial.enroll')
        ->middleware('web');

    // Juegos
    Route::get('/games',                    [ApiGameController::class, 'index'])->name('api.games.index');
    Route::post('/games/{id}/start',        [ApiGameController::class, 'start'])->name('api.games.start');
    Route::post('/games/{id}/finish',       [ApiGameController::class, 'finish'])->name('api.games.finish');

    // Emociones
    Route::post('/emotions',                [EmotionController::class, 'store'])->name('api.emotions.store');

    // Chat
    Route::get('/messages',                 [MessageController::class, 'index'])->name('api.messages.index');
    Route::post('/messages',                [MessageController::class, 'store'])->name('api.messages.store');
});