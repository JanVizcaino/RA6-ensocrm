<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('enso_game_emotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_game_id')->constrained('enso_users_games')->cascadeOnDelete();
            $table->string('emotion'); // ej. 'happy', 'frustrated', 'neutral'
            $table->decimal('confidence', 5, 4); // ej. 0.9850
            $table->timestamp('recorded_at'); // Timestamp exacto de la expresión
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('enso_game_emotions'); }
};