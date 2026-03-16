<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {

        $users = User::with('role')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? $user->role->name : 'Sin rol',
                'lastAccess' => $user->updated_at ? $user->updated_at->diffForHumans() : 'Desconocido',
                'status' => 'active',
            ];
        });

        return Inertia::render('Admin/Users', [
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:enso_users,email', 
            'role' => 'required|string',
        ]);

        $role = Role::where('name', $validated['role'])->first();

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt('Enso2026!'),
            'role_id' => $role ? $role->id : 3, 
        ]);

        return back();
    }


    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:enso_users,email,' . $id,
            'role' => 'required|string',
        ]);

        
        $role = Role::whereRaw('LOWER(name) = ?', [strtolower($validated['role'])])->firstOrFail();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $role->id, 
        ]);

        return back();
    }
}
