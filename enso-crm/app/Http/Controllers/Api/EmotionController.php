<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmotionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_game_id' => 'required|integer|exists:enso_users_games,id',
            'emotion'      => 'required|string|in:neutral,happy,sad,angry,surprised,fearful,disgusted',
            'confidence'   => 'required|numeric|min:0|max:1',
            'recorded_at'  => 'required|date',
        ]);

        DB::table('enso_game_emotions')->insert([
            'user_game_id' => $request->user_game_id,
            'emotion'      => $request->emotion,
            'confidence'   => $request->confidence,
            'recorded_at'  => $request->recorded_at,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['success' => true]);
    }

    
}