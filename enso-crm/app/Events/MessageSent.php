<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // 1. Declarar la propiedad explícitamente
    public $message;

    public function __construct(Message $message)
    {
        // 2. Asignarla e hidratar la relación
        $this->message = $message;
        $this->message->load('user');
    }

    public function broadcastOn(): Channel
    {
        return new Channel('chat');
    }

    public function broadcastAs(): string
    {
        // Esto coincide perfecto con tu frontend: channel.listen('.MessageSent')
        return 'MessageSent'; 
    }
    
    public function broadcastWith(): array
    {
        // Esto está PERFECTO. Coincide exactamente con tu interfaz ChatMessage en React.
        return [
            'id'         => $this->message->id,
            'body'       => $this->message->body,
            'created_at' => $this->message->created_at->toISOString(),
            'user'       => [
                'id'   => $this->message->user->id,
                'name' => $this->message->user->name,
                'role' => $this->message->user->role,
            ],
        ];
    }
}