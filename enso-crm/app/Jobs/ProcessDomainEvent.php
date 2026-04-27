<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessDomainEvent implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $event,
        public readonly array $payload,
    ) {
        $this->onConnection('rabbitmq');
        $this->onQueue(config('queue.connections.rabbitmq.queue', 'default'));
    }

    public function handle(): void
    {
        \Log::info('[RabbitMQ] Domain event received', [
            'event'   => $this->event,
            'payload' => $this->payload,
        ]);
    }
}
