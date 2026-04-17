<?php

namespace App\Http\Controllers\Player;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
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

    public function history()
    {
        $user = Auth::user();

        $history = UserGame::where('user_id', $user->id)
            ->orderBy('played_at', 'desc')
            ->with(['game', 'emotions'])
            ->get()
            ->map(function ($entry) {
                $primaryEmotion = $entry->emotions
                    ->countBy('emotion')
                    ->sortDesc()
                    ->keys()
                    ->first() ?? 'Sin datos';

                return [
                    'id' => $entry->user_id . '-' . $entry->game_id,
                    'game_id'         => $entry->game_id,
                    'game_name'       => $entry->game?->name ?? 'Juego eliminado',
                    'num_errors'      => $entry->num_errors,
                    'duration'        => $entry->duration,
                    'played_at'       => $entry->played_at,
                    'primary_emotion' => $primaryEmotion,
                ];
            });

        return Inertia::render('/History', [
            'userHistory' => $history,
        ]);
    }
}
