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
        'fund_cluster',
        'qr_code',
        'serial_number',
        'condition',
        'status',
        'office_id',
        'assigned_to',
        'purchase_date',
        'purchase_price',
        'reorder_level',
        'safety_stock',
        'unit',
        'stock',
        'item_type',
        'warranty_expiry',
        'notes',
        'last_condition_check'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
        'last_condition_check' => 'date',
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

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function borrowRecords()
    {
        return $this->hasMany(BorrowRecord::class);
    }

    public function conditionAudits()
    {
        return $this->hasMany(ConditionAudit::class);
    }

    public function mrItems()
    {
        return $this->hasMany(MRItem::class, 'item_id');
    }

    public function memorandumReceipts()
    {
        return $this->hasManyThrough(
            MemorandumReceipt::class,
            MRItem::class,
            'item_id',
            'id',
            'id',
            'mr_id'
        );
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

    /**
     * Get the current active Memorandum Receipt if this item is tracked
     */
    public function getCurrentMemorandumReceipt()
    {
        return $this->mrItems()
            ->whereHas('memorandumReceipt', function ($query) {
                $query->whereIn('status', ['Pending Signature', 'Approved', 'Released']);
            })
            ->with('memorandumReceipt')
            ->latest()
            ->first();
    }

    /**
     * Get all Memorandum Receipts this item has been on
     */
    public function getMRHistory()
    {
        return $this->mrItems()
            ->with('memorandumReceipt')
            ->orderByDesc('created_at')
            ->get();
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

