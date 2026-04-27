<?php

namespace App\Providers;

use App\Events\GameSessionStarted;
use App\Listeners\PublishGameSessionToRabbitMQ;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        //  URL::forceScheme('https');

        Event::listen(GameSessionStarted::class, PublishGameSessionToRabbitMQ::class);
    }
}
