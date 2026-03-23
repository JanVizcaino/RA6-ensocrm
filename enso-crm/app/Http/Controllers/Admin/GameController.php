<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GameController extends Controller
{
    public function index()
    {
        $games = Game::orderBy('name')->get();

        return Inertia::render('Admin/Games', [
            'games' => $games,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:100|unique:enso_games,name',
            'description'  => 'nullable|string',
            'path'         => 'required|string|max:255',
            'is_published' => 'required|boolean',
        ]);

        Game::create([
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'path'         => $validated['path'],
            'is_published' => $validated['is_published'],
        ]);

        return back()->with('success', 'Juego creado correctamente.');
    }

    public function update(Request $request, int $id)
    {
        $game = Game::findOrFail($id);

        $validated = $request->validate([
            'name'         => 'required|string|max:100|unique:enso_games,name,' . $id,
            'description'  => 'nullable|string',
            'path'         => 'required|string|max:255',
            'is_published' => 'required|boolean',
        ]);

        $game->update($validated);

        return back()->with('success', 'Juego actualizado.');
    }

    public function destroy(int $id)
    {
        $game = Game::findOrFail($id);
        $game->delete();

        return back()->with('success', 'Juego eliminado.');
    }

    public function play(int $id)
    {
        $game = Game::findOrFail($id);

        return Inertia::render('Admin/Play', [
            'game' => $game,
        ]);
    }
}