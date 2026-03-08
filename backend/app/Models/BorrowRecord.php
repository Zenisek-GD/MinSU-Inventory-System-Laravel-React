<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BorrowRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'borrowed_by',
        'approved_by',
        'borrow_date',
        'expected_return_date',
        'actual_return_date',
        'purpose',
        'condition_before',
        'condition_after',
        'status',
        'notes'
    ];

    protected $casts = [
        'borrow_date' => 'date',
        'expected_return_date' => 'date',
        'actual_return_date' => 'date',
    ];

    // Relationships
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function borrowedBy()
    {
        return $this->belongsTo(User::class, 'borrowed_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'Pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }

    public function scopeBorrowed($query)
    {
        return $query->where('status', 'Borrowed');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'Borrowed')
            ->where('expected_return_date', '<', now());
    }

    public function scopeByBorrower($query, $userId)
    {
        return $query->where('borrowed_by', $userId);
    }

    // Methods
    public function approve($approvedBy)
    {
        $this->update([
            'status' => 'Approved',
            'approved_by' => $approvedBy,
        ]);

        // Update item status
        $this->item->update(['status' => 'Borrowed']);

        // Decrement stock when approved
        if ($this->item->stock > 0) {
            $this->item->decrement('stock');
        }
    }

    public function reject()
    {
        $this->update(['status' => 'Rejected']);
    }

    public function markAsBorrowed()
    {
        $this->update(['status' => 'Borrowed']);
    }

    public function returnItem($conditionAfter, $returnDate = null)
    {
        $this->update([
            'status' => 'Returned',
            'condition_after' => $conditionAfter,
            'actual_return_date' => $returnDate ?? now(),
        ]);

        // Update item status and condition
        $this->item->update([
            'status' => 'Available',
            'condition' => $conditionAfter,
        ]);

        // Increment stock when returned
        $this->item->increment('stock');
    }

    public function markAsLost()
    {
        $this->update(['status' => 'Lost']);

        // Update item status
        $this->item->update(['status' => 'Lost']);
    }

    public function getIsOverdueAttribute()
    {
        return $this->status === 'Borrowed' &&
            $this->expected_return_date < now();
    }

    public function getDaysOverdueAttribute()
    {
        if (!$this->is_overdue) {
            return 0;
        }

        return now()->diffInDays($this->expected_return_date);
    }

    public function getCanBeReturnedAttribute()
    {
        return in_array($this->status, ['Approved', 'Borrowed']);
    }

    public function getCanBeApprovedAttribute()
    {
        return $this->status === 'Pending';
    }

    /**
     * Check if borrowing this item violates consumable restrictions
     * Consumables can only be borrowed in bulk units (reams, pairs, bundles, boxes, kits)
     */
    public function isConsumableViolation(): bool
    {
        if (!$this->item) {
            return false;
        }

        // Consumable items can only be borrowed in bulk units
        if ($this->item->item_type === 'consumable') {
            $validConsumableUnits = ['reams', 'pairs', 'bundles', 'boxes', 'kits', 'sets', 'liters', 'kg', 'meters'];
            return !in_array(strtolower($this->item->unit), $validConsumableUnits);
        }

        return false;
    }

    /**
     * Get consumable restriction message
     */
    public function getConsumableRestrictionMessage(): string
    {
        if ($this->isConsumableViolation()) {
            return "Consumable items can only be borrowed in bulk units (reams, pairs, bundles, boxes, kits, sets, liters, kg, meters). This item is measured in: {$this->item->unit}";
        }

        return '';
    }
}
