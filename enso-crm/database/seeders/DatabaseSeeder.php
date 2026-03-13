<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear los Roles de ENSO
        $roles = [
            ['name' => 'Admin'],
            ['name' => 'Gestor'],
            ['name' => 'Jugador'],
        ];
        DB::table('enso_roles')->insert($roles);

        // 2. Crear un usuario para cada rol
        User::factory()->create([
            'name' => 'Administrador ENSO',
            'email' => 'admin@enso.com',
            'password' => Hash::make('password123'),
            'role_id' => 1, // Admin
        ]);

        User::factory()->create([
            'name' => 'Gestor Académico',
            'email' => 'gestor@enso.com',
            'password' => Hash::make('password123'),
            'role_id' => 2, // Gestor
        ]);

        User::factory()->create([
            'name' => 'Jugador Estudiante',
            'email' => 'jugador@enso.com',
            'password' => Hash::make('password123'),
            'role_id' => 3, // Jugador
        ]);
    }
}