<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User; 
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
}