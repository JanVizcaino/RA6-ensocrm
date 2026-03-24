<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'face_photo_path',
    ];
    
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function isAdmin(): bool  { return $this->role === 'admin';  }
    public function isGestor(): bool { return $this->role === 'gestor'; }
    public function isPlayer(): bool { return $this->role === 'player'; }
    public function isStaff(): bool  { return in_array($this->role, ['admin', 'gestor']); }

    public function games()
    {
        return $this->belongsToMany(Game::class, 'enso_users_games', 'user_id', 'game_id')
                    ->withPivot('num_errors', 'duration', 'result', 'played_at');
    }
}