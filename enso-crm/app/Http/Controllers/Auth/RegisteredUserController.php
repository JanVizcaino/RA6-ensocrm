<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return inertia('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password'      => ['required', 'confirmed', Rules\Password::defaults()],
            'foto_registro' => 'nullable|image|max:10240',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'player',
        ]);

        // Guardar foto facial si viene
        if ($request->hasFile('foto_registro')) {
            $path = $request->file('foto_registro')->storeAs(
                'faces',
                $user->id . '.jpg',
                'private'
            );
            $user->update(['face_photo_path' => $path]);
        }

        event(new Registered($user));
        Auth::login($user);

        return redirect()->route('player.dashboard');
    }
}