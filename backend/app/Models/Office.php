<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Office extends Model
{
    use HasFactory;

    // Unified fillable including legacy fields and new hierarchy fields
    protected $fillable = [
        'name',
        'type',
        'category',
        'qr_code',
        'description',
        'location',
        'rooms',
        'laboratories',
        // hierarchy
        'department_id',
        'room_number',
        'building',
        'floor',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }


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
