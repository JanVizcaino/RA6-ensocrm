<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class UserGame extends Model
{

    protected $table = 'enso_users_games';
    protected $fillable = [
        'user_id',
        'game_id',
        'num_errors',
        'duration',
        'played_at',
    ];

    protected $casts = [
        'played_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game()
    {
        return $this->belongsTo(Game::class, 'game_id');
    }

    public function emotions()
    {
        return $this->hasMany(GameEmotion::class, 'user_game_id');
    }

    
}