<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConditionAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'checked_by',
        'audit_year',
        'condition',
        'remarks',
        'recommendations',
        'next_audit_date'
    ];

    protected $casts = [
        'next_audit_date' => 'date',
    ];

    // Relationships
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function checkedBy()
    {
        return $this->belongsTo(User::class, 'checked_by');
    }

    // Scopes
    public function scopeByYear($query, $year)
    {
        return $query->where('audit_year', $year);
    }

    public function scopeByChecker($query, $userId)
    {
        return $query->where('checked_by', $userId);
    }

    public function scopeNeedsFollowUp($query)
    {
        return $query->whereIn('condition', ['Needs Repair', 'Damaged'])
                    ->orWhereNotNull('next_audit_date')
                    ->where('next_audit_date', '<=', now()->addDays(30));
    }

    // Methods
    public function getConditionBadgeAttribute()
    {
        $badges = [
            'Excellent' => 'success',
            'Good' => 'primary',
            'Fair' => 'warning',
            'Needs Repair' => 'warning',
            'Damaged' => 'danger',
            'Disposed' => 'secondary',
        ];

        return $badges[$this->condition] ?? 'secondary';
    }

    public function requiresAction()
    {
        return in_array($this->condition, ['Needs Repair', 'Damaged']);
    }

    public function isUpcomingAudit()
    {
        return $this->next_audit_date && 
               $this->next_audit_date <= now()->addDays(30) &&
               $this->next_audit_date >= now();
    }
}