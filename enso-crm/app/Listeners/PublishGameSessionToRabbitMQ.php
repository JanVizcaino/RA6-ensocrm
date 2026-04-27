<?php

namespace App\Listeners;

use App\Events\GameSessionStarted;
use App\Jobs\ProcessDomainEvent;

class PublishGameSessionToRabbitMQ
{
    public function handle(GameSessionStarted $event): void
    {
        ProcessDomainEvent::dispatch('game_session.started', [
            'user_id'    => $event->userId,
            'game_type'  => $event->gameType,
            'session_id' => $event->sessionId,
            'timestamp'  => now()->toISOString(),
        ]);
    }
}
