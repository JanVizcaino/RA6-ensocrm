<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Game;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'     => 'Administrador',
            'email'    => 'admin@enso.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);

        User::create([
            'name'     => 'Gestor Demo',
            'email'    => 'gestor@enso.com',
            'password' => Hash::make('password123'),
            'role'     => 'gestor',
        ]);

        User::create([
            'name'     => 'Jugador Demo',
            'email'    => 'jugador@enso.com',
            'password' => Hash::make('password123'),
            'role'     => 'player',
        ]);

        Game::create([
            'name'         => 'Wisconsin 3D',
            'description'  => 'Test de clasificación de cartas en 3D. Evalúa la flexibilidad cognitiva.',
            'path'         => 'CardSortingGame3D',
            'is_published' => true,
        ]);
    }
}