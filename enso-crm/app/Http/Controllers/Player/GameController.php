<?php

namespace App\Http\Controllers\Player;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GameController extends Controller
{
    public function index()
    {
        $games = Game::where('is_published', true)->orderBy('name')->get();

        return Inertia::render('Player/Index', [
            'games' => $games,
        ]);
    }

    public function play(int $id)
    {
        $game = Game::findOrFail($id);

        return Inertia::render('Player/Play', [
            'game' => $game,
        ]);
    }

   
}
