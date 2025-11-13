<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'pr_number',
        'office_id',
        'requested_by',
        'purpose',
        'status',
        'total_estimated_cost',
        'approved_by',
        'approved_at',
        'notes'
    ];

    protected $casts = [
        'total_estimated_cost' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
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

    public function scopeRejected($query)
    {
        return $query->where('status', 'Rejected');
    }

    public function scopeByOffice($query, $officeId)
    {
        return $query->where('office_id', $officeId);
    }

    public function scopeByRequester($query, $userId)
    {
        return $query->where('requested_by', $userId);
    }

    // Methods
    public function canBeApproved()
    {
        return in_array($this->status, ['Draft', 'Pending']);
    }

    public function canBeEdited()
    {
        return in_array($this->status, ['Draft', 'Pending']);
    }

    public function approve($approvedBy)
    {
        $this->update([
            'status' => 'Approved',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
        ]);
    }

    public function reject()
    {
        $this->update([
            'status' => 'Rejected',
            'approved_by' => null,
            'approved_at' => null,
        ]);
    }

    public function markAsOrdered()
    {
        $this->update(['status' => 'Ordered']);
    }

    public function markAsCompleted()
    {
        $this->update(['status' => 'Completed']);
    }

    public function getIsPendingAttribute()
    {
        return $this->status === 'Pending';
    }

    public function getIsApprovedAttribute()
    {
        return $this->status === 'Approved';
    }

    public function getIsRejectedAttribute()
    {
        return $this->status === 'Rejected';
    }
}

