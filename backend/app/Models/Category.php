<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'parent_id',
    ];

     // Relationships
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    // Scopes
    public function scopeRootCategories($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeWithChildren($query)
    {
        return $query->with('children');
    }

    // Methods
    public function getTotalItemsAttribute()
    {
        return $this->items()->count();
    }

    public function isRoot()
    {
        return is_null($this->parent_id);
    }

    public function getFullPathAttribute()
    {
        if ($this->parent) {
            return $this->parent->full_path . ' > ' . $this->name;
        }
        return $this->name;
    }
}