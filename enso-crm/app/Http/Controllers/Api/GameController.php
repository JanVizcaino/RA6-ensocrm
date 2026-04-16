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

    // Crea el registro al inicio — devuelve user_game_id para las emociones
    public function start(Request $request, int $id): JsonResponse
    {
        $game = Game::findOrFail($id);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $userGameId = DB::table('enso_users_games')->insertGetId([
            'user_id'    => $user->id,
            'game_id'    => $game->id,
            'played_at'  => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success'      => true,
            'user_game_id' => $userGameId,
        ]);
    }

    // Actualiza el registro existente con el resultado final
    public function finish(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'user_game_id' => 'required|integer|exists:enso_users_games,id',
            'errors'       => 'nullable|integer|min:0',
            'duration'     => 'nullable|integer|min:0',
        ]);

        DB::table('enso_users_games')
            ->where('id', $validated['user_game_id'])
            ->update([
                'num_errors' => $validated['errors'] ?? null,
                'duration'   => $validated['duration'] ?? null,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Partida guardada.',
            'result'  => [
                'errors'   => $validated['errors'] ?? 0,
                'duration' => $validated['duration'] ?? null,
            ],
        ]);
    }
}