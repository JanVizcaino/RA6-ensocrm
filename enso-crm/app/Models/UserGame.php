<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class UserGame extends Model
{
    public $timestamps = false;
    public $incrementing = false;

    protected $primaryKey = ['user_id', 'game_id'];

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

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}