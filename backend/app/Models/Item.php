<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'category_id',
        'qr_code',
        'serial_number',
        'condition',
        'status',
        'office_id',
        'purchase_date',
        'purchase_price',
        'warranty_expiry',
        'notes'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
        'purchase_price' => 'decimal:2',
    ];

    // Relationships
    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function borrowRecords()
    {
        return $this->hasMany(BorrowRecord::class);
    }

    public function conditionAudits()
    {
        return $this->hasMany(ConditionAudit::class);
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'Available');
    }

    public function scopeBorrowed($query)
    {
        return $query->where('status', 'Borrowed');
    }

    public function scopeByCondition($query, $condition)
    {
        return $query->where('condition', $condition);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByOffice($query, $officeId)
    {
        return $query->where('office_id', $officeId);
    }

    public function scopeNeedsMaintenance($query)
    {
        return $query->whereIn('condition', ['Needs Repair', 'Damaged'])
                    ->orWhere('status', 'Under Maintenance');
    }

    // Methods
    public function getCurrentBorrowAttribute()
    {
        return $this->borrowRecords()
            ->whereIn('status', ['Approved', 'Borrowed'])
            ->first();
    }

    public function getLatestAuditAttribute()
    {
        return $this->conditionAudits()
            ->latest()
            ->first();
    }

    public function isAvailable()
    {
        return $this->status === 'Available';
    }

    public function isBorrowed()
    {
        return $this->status === 'Borrowed';
    }

    public function needsRepair()
    {
        return in_array($this->condition, ['Needs Repair', 'Damaged']);
    }

    public function getWarrantyStatusAttribute()
    {
        if (!$this->warranty_expiry) {
            return 'No Warranty';
        }

        if (now()->gt($this->warranty_expiry)) {
            return 'Expired';
        }

        if (now()->diffInDays($this->warranty_expiry) <= 30) {
            return 'Expiring Soon';
        }

        return 'Active';
    }
}

