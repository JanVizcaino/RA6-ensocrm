<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameSessionStarted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int    $userId,
        public readonly string $gameType,
        public readonly string $sessionId,
    ) {}
}
