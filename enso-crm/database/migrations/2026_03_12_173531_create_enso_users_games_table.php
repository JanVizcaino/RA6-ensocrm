<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('enso_users_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('enso_users')->cascadeOnDelete();
            $table->foreignId('game_id')->constrained('enso_games')->cascadeOnDelete();
            $table->integer('duration')->nullable(); // En segundos
            $table->json('result')->nullable(); // JSON flexible para puntuaciones/métricas
            $table->timestamp('played_at')->useCurrent();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('enso_users_games'); }
};