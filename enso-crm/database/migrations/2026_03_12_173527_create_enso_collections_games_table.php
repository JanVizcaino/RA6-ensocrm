<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('enso_collections_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained('enso_collections')->cascadeOnDelete();
            $table->foreignId('game_id')->constrained('enso_games')->cascadeOnDelete();
            
            // Configuración de dificultad
            $table->integer('min_time')->nullable(); // Segundos
            $table->integer('max_time')->nullable(); // Segundos
            $table->integer('max_errors')->nullable();
            
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('enso_collections_games'); }
};