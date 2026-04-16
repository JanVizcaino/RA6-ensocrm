<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function index(): JsonResponse
    {
        $messages = Message::with('user')
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn($m) => [
                'id'         => $m->id,
                'body'       => $m->body,
                'created_at' => $m->created_at->toISOString(),
                'user'       => [
                    'id'   => $m->user->id,
                    'name' => $m->user->name,
                    'role' => $m->user->role,
                ],
            ]);

        return response()->json($messages);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $message = Message::create([
            'user_id' => $user->id,
            'body'    => $request->body,
        ]);

        broadcast(new MessageSent($message))->toOthers();

        $message->load('user');

        return response()->json([
            'id'         => $message->id,
            'body'       => $message->body,
            'created_at' => $message->created_at->toISOString(),
            'user'       => [
                'id'   => $message->user->id,
                'name' => $message->user->name,
                'role' => $message->user->role,
            ],
        ]);
    }
}