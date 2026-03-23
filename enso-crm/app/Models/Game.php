<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    protected $table = 'enso_games';

    protected $fillable = [
        'name',
        'description',
        'path',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'enso_users_games', 'game_id', 'user_id')
                    ->withPivot('num_errors', 'duration', 'result', 'played_at');
    }
}