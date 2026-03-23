<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    public function index(): JsonResponse
    {
        $games = Game::where('is_published', true)
                     ->orderBy('name')
                     ->get(['id', 'name', 'description', 'path', 'is_published']);

        return response()->json($games);
    }

    public function finish(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'errors'   => 'nullable|integer|min:0',
            'duration' => 'nullable|integer|min:0',
        ]);

        $game = Game::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        DB::table('enso_users_games')->insert([
            'user_id'    => $user->id,
            'game_id'    => $game->id,
            'num_errors' => $validated['errors'] ?? null,
            'duration'   => $validated['duration'] ?? null,
            'played_at'  => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success'  => true,
            'message'  => 'Partida guardada.',
            'result'   => [
                'errors'   => $validated['errors'] ?? 0,
                'duration' => $validated['duration'] ?? null,
            ],
        ]);
    }
}