<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     * Permite pasar múltiples roles separados por coma (ej: role:Admin,Gestor)
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1. Verificamos que el usuario esté logueado y tenga un rol
        $user = $request->user();
        
        if (!$user || !$user->role) {
            return redirect('/');
        }

        // 2. Comprobamos si el nombre de su rol está en la lista de roles permitidos
        if (!in_array($user->role->name, $roles)) {
            // Si intenta colarse, lo devolvemos a la raíz (el semáforo lo enviará a su sitio correcto)
            // Opcional: podrías usar abort(403, 'Acceso denegado'); para mostrar una página de error.
            return redirect('/'); 
        }

        return $next($request);
    }
}