<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        // Precargamos el juego y las emociones del historial
        $users = User::with(['history.game', 'history.emotions'])
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id'              => $user->id,
                    'name'            => $user->name,
                    'email'           => $user->email,
                    'role'            => $user->role,
                    'has_face_photo'  => !empty($user->face_photo_path),
                    'lastAccess'      => $user->updated_at?->diffForHumans() ?? 'Desconocido',
                    'status'          => 'active',
                    'history'         => $user->history->map(function ($record) {

                        // 1. Contamos cuántas veces se repite cada emoción
                        // 2. Ordenamos de mayor a menor
                        // 3. Obtenemos las llaves (nombres de las emociones)
                        // 4. Nos quedamos con la primera (la más frecuente)
                        $primaryEmotion = $record->emotions
                            ->countBy('emotion')
                            ->sortDesc()
                            ->keys()
                            ->first() ?? 'Sin datos'; // Fallback por si no hay registros

                        return [
                            'id'              => $record->id,
                            'game_id'         => $record->game_id,
                            'game_name'       => $record->game?->name ?? 'Juego eliminado',
                            'num_errors'      => $record->num_errors,
                            'duration'        => $record->duration,
                            'played_at'       => $record->played_at,
                            'primary_emotion' => $primaryEmotion, // <-- Se lo mandamos al front
                        ];
                    }),
                ];
            });

        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:admin,gestor,player',
        ]);

        User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email,' . $id,
            'role'     => 'required|in:admin,gestor,player',
            'password' => 'nullable|string|min:8',
        ]);

        $user->update([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'role'     => $validated['role'],
            'password' => isset($validated['password']) && $validated['password']
                ? Hash::make($validated['password'])
                : $user->password,
        ]);

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function uploadFace(Request $request, int $id)
    {
        $request->validate([
            'foto' => 'required|image|max:10240',
        ]);

        $user = User::findOrFail($id);

        // Borrar foto anterior si existe
        if ($user->face_photo_path && Storage::disk('private')->exists($user->face_photo_path)) {
            Storage::disk('private')->delete($user->face_photo_path);
        }

        $path = $request->file('foto')->storeAs(
            'faces',
            $user->id . '.jpg',
            'private'
        );

        $user->update(['face_photo_path' => $path]);

        return back()->with('success', 'Foto facial actualizada.');
    }

    public function destroy(int $id)
    {
        $user = User::findOrFail($id);

        if ($user->face_photo_path && Storage::disk('private')->exists($user->face_photo_path)) {
            Storage::disk('private')->delete($user->face_photo_path);
        }

        $user->delete();
        return back()->with('success', 'Usuario eliminado.');
    }
}
