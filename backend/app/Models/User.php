<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;
    const ROLE_ADMIN = 'admin';
    const ROLE_SUPPLY_OFFICER = 'supply_officer';
    const ROLE_STAFF = 'staff';

    /**
     * The attributes that are mass assignable.
     *
     * 
     */
    protected $fillable = [
        'name',
        'email',
        'password',
         'role',
        'office_id',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     *
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * 
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relationship: A user belongs to one office.
     */
    public function office()
    {
        return $this->belongsTo(Office::class);
    }

   // Role checking methods
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isSupplyOfficer(): bool
    {
        return $this->role === self::ROLE_SUPPLY_OFFICER;
    }

    public function isStaff(): bool
    {
        return $this->role === self::ROLE_STAFF;
    }

    // Scope methods
    public function scopeAdmins($query)
    {
        return $query->where('role', self::ROLE_ADMIN);
    }

    public function scopeSupplyOfficers($query)
    {
        return $query->where('role', self::ROLE_SUPPLY_OFFICER);
    }

    public function scopeStaff($query)
    {
        return $query->where('role', self::ROLE_STAFF);
    }
}