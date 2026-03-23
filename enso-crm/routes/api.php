<?php

use App\Http\Controllers\Api\GameController as ApiGameController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/games/{id}/finish', [ApiGameController::class, 'finish'])
        ->name('api.games.finish');

    Route::get('/games', [ApiGameController::class, 'index'])
        ->name('api.games.index');
});