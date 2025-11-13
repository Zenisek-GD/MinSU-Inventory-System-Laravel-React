<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginUserRequest;
use App\Http\Requests\Api\V1\RegisterUserRequest;
use App\Models\User;
use App\Traits\ApiResponses;
use Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    use ApiResponses;

    /**
     * Register a new user
     */
     public function register(RegisterUserRequest $request)
    {
        try {
            $validated = $request->validated();

            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role'     => $validated['role'] ?? 'staff', 
                'office_id' => $validated['office_id'] ?? null,
            ]);

            // Create token with abilities
            $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

            return $this->ok('User registered successfully', [
                'user'  => $user->load('office'), 
                'token' => $token,
                'role'  => $user->role,
            ]);
        } catch (\Exception $e) {
            return $this->error('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Login existing user
     */
     public function login(LoginUserRequest $request)
    {
        try {
            $validated = $request->validated();

            $user = User::with('office')->where('email', $validated['email'])->first();
            
            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return $this->error('Invalid email or password', 401);
            }

            // Delete existing tokens and create new one
            $user->tokens()->delete();
            $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

            return $this->ok('Login successful', [
                'user'  => $user,
                'token' => $token,
                'role'  => $user->role,
            ]);
        } catch (\Exception $e) {
            return $this->error('Login failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Logout current user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $cookie = cookie()->forget('auth_token');

        return $this->ok('Logged out successfully')->withCookie($cookie);
    }

    public function roleCounts()
    {
        return [
            'admin' => User::where('role', 'admin')->count(),
            'supply_officer' => User::where('role', 'supply_officer')->count(),
            'staff' => User::where('role', 'staff')->count(),
        ];
    }

    /**
     * Fetch current user profile
     */
    public function profile(Request $request)
    {
        $user = $request->user()->load('office');
        
        return $this->ok('User profile retrieved successfully', [
            'user' => $user,
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return $this->ok('Profile updated successfully', [
            'user' => $user->fresh('office'),
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $this->error('Current password is incorrect', 422);
        }

        $user->update([
            'password' => $validated['password']
        ]);

        return $this->ok('Password changed successfully');
    }
}