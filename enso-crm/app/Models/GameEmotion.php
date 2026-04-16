<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameEmotion extends Model
{
    // Le indicamos explícitamente el nombre de tu tabla
    protected $table = 'enso_game_emotions';
    
    // Desactivamos la protección de asignación masiva porque ya la validas en el controlador
    protected $guarded = [];
}