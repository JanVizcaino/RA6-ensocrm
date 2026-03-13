<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::rename('users', 'enso_users');
        Schema::table('enso_users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->constrained('enso_roles')->nullOnDelete();
        });
    }
    public function down(): void {
        Schema::table('enso_users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
        Schema::rename('enso_users', 'users');
    }
};