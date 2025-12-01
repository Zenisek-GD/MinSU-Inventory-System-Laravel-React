<?php

namespace App\Services;

use App\Models\StockMovement;
use App\Models\Item;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Record a stock movement and return it.
     * This method wraps the insert in a DB transaction to allow future extensions.
     */
    public function recordMovement(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Basic validation handled by controller/requests; create movement
            $movement = StockMovement::create($data);

            // Optionally, update item aggregate fields here in future
            // e.g., maintain cached quantity_on_hand on items

            return $movement;
        });
    }
}
