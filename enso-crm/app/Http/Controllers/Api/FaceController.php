<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class FaceController extends Controller
{
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'email'       => 'required|email',
            'foto_webcam' => 'required|image|max:10240',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'verified' => false,
                'message'  => 'Usuario no encontrado.',
            ], 404);
        }

        if (!$user->face_photo_path || !Storage::exists($user->face_photo_path)) {
            return response()->json([
                'verified' => false,
                'message'  => 'Este usuario no tiene foto registrada.',
                'no_photo' => true,
            ], 422);
        }

        $url = env('FACIAL_SERVICE_URL', 'http://127.0.0.1:8181/verify');

        try {
            $fotoRegistro = Storage::get($user->face_photo_path);
            $fotoWebcam   = file_get_contents($request->file('foto_webcam')->getRealPath());

            $extWebcam = $request->file('foto_webcam')->extension();
            $extRegistro = pathinfo($user->face_photo_path, PATHINFO_EXTENSION);

            $response = Http::timeout(60)
                ->attach('img1', $fotoRegistro, 'registro.' . $extRegistro)
                ->attach('img2', $fotoWebcam,   'webcam.' . $extWebcam)
                ->post($url);

            $resultado = $response->json(); 

            if ($response->failed()) {
                return response()->json([
                    'verified' => false,
                    'message'  => $resultado['detail'] ?? 'Error en el microservicio.',
                ], 422);
            }
            if ($resultado['verified']) {
                Auth::login($user);
                $request->session()->regenerate();

                return response()->json([
                    'verified' => true,
                    'redirect' => $user->isPlayer()
                        ? route('player.dashboard')
                        : route('admin.dashboard'),
                ]);
            }

            return response()->json([
                'verified' => false,
                'message'  => 'El rostro no coincide.',
                'distance' => $resultado['distance'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'verified' => false,
                'message'  => 'Error de conexión con el microservicio: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function enroll(Request $request): JsonResponse
    {
        $request->validate([
            'foto' => 'required|image|max:10240',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->face_photo_path && Storage::exists($user->face_photo_path)) {
            Storage::delete($user->face_photo_path);
        }

        $extension = $request->file('foto')->extension();
        $path = $request->file('foto')->storeAs(
            'faces',
            $user->id . '.' . $extension,
            'private'
        );

        $user->update(['face_photo_path' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Foto registrada correctamente.',
        ]);
    }
}
