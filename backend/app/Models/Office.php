<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'qr_code', 
        'description', 
        'location'
    ];


     // Relationships
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }





     // Scopes
    public function scopeActive($query)
    {
        return $query->whereHas('users', function ($q) {
            $q->where('is_active', true);
        });
    }

    // Methods
    public function getTotalItemsAttribute()
    {
        return $this->items()->count();
    }

    public function getActiveUsersAttribute()
    {
        return $this->users()->where('is_active', true)->count();
    }
}
