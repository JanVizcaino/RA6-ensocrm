<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class UserGame extends Model
{
    // ELIMINADAS: public $timestamps, public $incrementing y protected $primaryKey
    // Laravel ahora asumirá correctamente que la clave primaria es 'id'

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
        // Ahora esto funcionará porque la primary key del modelo volverá a ser 'id'
        return $this->hasMany(GameEmotion::class, 'user_game_id');
    }
}