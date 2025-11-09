<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginUserRequest;
use App\Http\Requests\Api\V1\RegisterUserRequest;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponses;

    /**
     *  Register a new user
     */
    public function register(RegisterUserRequest $request)
    {
        $validated = $request->validated();

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role'     => $request->role ?? 'user', // optional role input
        ]);

        $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

        return $this->ok('User registered successfully', [
            'user'  => $user,
            'token' => $token,
            'role'  => $user->role,
        ]);
    }

    /**
     * Login existing user
     */
    public function login(LoginUserRequest $request)
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->error('Invalid email or password', 401);
        }

        if (isset($user->is_active) && !$user->is_active) {
            return $this->error('Account is deactivated', 403);
        }

        // delete old tokens before issuing new one
        $user->tokens()->delete();

        $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

        return $this->ok('Login successful', [
            'user'  => $user,
            'token' => $token,
            'role'  => $user->role,
        ]);
    }

    /**
     * Logout current user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->ok('Successfully logged out');
    }

    /**
     *  Fetch current user profile
     */
    public function profile(Request $request)
    {
        return $this->ok('User profile retrieved successfully', [
            'user' => $request->user(),
        ]);
    }
}
