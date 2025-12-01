<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'change_qty',
        'movement_type',
        'reason',
        'reference_type',
        'reference_id',
        'performed_by',
        'from_office_id',
        'to_office_id',
        'notes'
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function fromOffice()
    {
        return $this->belongsTo(Office::class, 'from_office_id');
    }

    public function toOffice()
    {
        return $this->belongsTo(Office::class, 'to_office_id');
    }
}
