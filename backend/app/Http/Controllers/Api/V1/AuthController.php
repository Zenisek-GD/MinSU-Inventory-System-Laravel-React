<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginUserRequest;
use App\Http\Requests\Api\V1\RegisterUserRequest;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

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
                'name'      => $validated['name'],
                'email'     => $validated['email'],
                'password'  => Hash::make($validated['password']),
                'role'      => $validated['role'] ?? 'staff',
                'office_id' => $validated['office_id'] ?? null,
            ]);

            return $this->ok('User registered successfully', [
                'user' => $user->load('office'),
                'role' => $user->role,
            ]);

        } catch (\Exception $e) {
            return $this->error('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Login existing user (SESSION BASED)
     */
    public function login(LoginUserRequest $request)
    {
        try {
            $credentials = $request->validated();

            if (!Auth::attempt([
                'email'    => $credentials['email'],
                'password' => $credentials['password']
            ])) {
                return $this->error('Invalid email or password', 401);
            }

            // Regenerate session for security
            $request->session()->regenerate();

            $user = Auth::user()->load('office');

            return $this->ok('Login successful', [
                'user' => $user,
                'role' => $user->role,
            ]);

        } catch (\Exception $e) {
            return $this->error('Login failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Logout current user (SESSION)
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->ok('Logged out successfully');
    }

    public function roleCounts()
    {
        return [
            'admin'           => User::where('role', 'admin')->count(),
            'supply_officer'  => User::where('role', 'supply_officer')->count(),
            'staff'           => User::where('role', 'staff')->count(),
        ];
    }

    /**
     * Fetch current user profile (SESSION AUTH)
     */
    public function profile(Request $request)
    {
        $user = Auth::user()->load('office');

        return $this->ok('User profile retrieved successfully', [
            'user' => $user,
            'role' => $user->role
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
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
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $this->error('Current password is incorrect', 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return $this->ok('Password changed successfully');
    }
}
