<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = ['college_id', 'name', 'room_number', 'building', 'floor'];

    public function college(): BelongsTo
    {
        return $this->belongsTo(College::class);
    }

    public function offices(): HasMany
    {
        return $this->hasMany(Office::class);
    }
}
