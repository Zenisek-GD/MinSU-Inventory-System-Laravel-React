<?php

namespace App\Services;

use App\Models\StockMovement;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StockService
{
    /**
     * Record a stock movement with full ledger system implementation.
     * Handles all movement types: purchase, transfer, adjustment, damage, disposal
     * 
     * @param array $data Movement data including type, quantity, item_id, etc.
     * @return StockMovement
     * @throws \Exception
     */
    public function recordMovement(array $data)
    {
        return DB::transaction(function () use ($data) {
            // 1. Create stock_movement record (ledger entry)
            $movement = StockMovement::create($data);

            // 2. Get the item
            $item = Item::findOrFail($data['item_id']);

            // 3. Update item current_stock based on quantity
            $item->current_stock += $data['quantity'];

            // 4. Update item status based on movement type
            if (isset($data['type'])) {
                switch ($data['type']) {
                    case 'damage':
                        // Mark item as damaged if quantity goes negative or explicit damage
                        if ($data['quantity'] < 0) {
                            $item->status = 'Lost'; // Using 'Lost' as closest to damaged in enum
                            $item->condition = 'Damaged';
                        }
                        break;

                    case 'disposal':
                        // Item disposed - mark appropriately
                        if ($item->current_stock <= 0) {
                            $item->status = 'Disposed';
                            $item->condition = 'Disposed';
                        }
                        break;

                    case 'purchase':
                    case 'adjustment':
                        // If adding stock and item was damaged/disposed, restore to available
                        if ($data['quantity'] > 0 && in_array($item->status, ['Lost', 'Disposed'])) {
                            $item->status = 'Available';
                            $item->condition = 'Good';
                        }
                        break;
                }
            }

            // 5. Update item office location for transfers
            if (isset($data['type']) && $data['type'] === 'transfer' && isset($data['to_office_id'])) {
                $item->office_id = $data['to_office_id'];
            }

            // 6. Save item changes
            $item->save();

            // 7. Check reorder level and log warning if needed
            if ($item->current_stock <= $item->reorder_level) {
                Log::warning("Item {$item->name} (ID: {$item->id}) is at or below reorder level. Current: {$item->current_stock}, Reorder: {$item->reorder_level}");
            }

            // 8. Check safety stock level
            if ($item->current_stock <= $item->safety_stock) {
                Log::alert("Item {$item->name} (ID: {$item->id}) is at or below safety stock! Current: {$item->current_stock}, Safety: {$item->safety_stock}");
            }

            // Reload relationships
            $movement->load('item', 'performedBy', 'fromOffice', 'toOffice');

            return $movement;
        });
    }

    /**
     * Calculate current stock for an item from ledger
     * This verifies the current_stock field matches the ledger
     * 
     * @param int $itemId
     * @return int
     */
    public function calculateStockFromLedger(int $itemId): int
    {
        return StockMovement::where('item_id', $itemId)
            ->sum('quantity');
    }

    /**
     * Reconcile item stock with ledger
     * Fixes discrepancies between current_stock and ledger total
     * 
     * @param int $itemId
     * @return array ['old_stock' => int, 'calculated_stock' => int, 'difference' => int]
     */
    public function reconcileStock(int $itemId): array
    {
        return DB::transaction(function () use ($itemId) {
            $item = Item::findOrFail($itemId);
            $oldStock = $item->current_stock;
            $calculatedStock = $this->calculateStockFromLedger($itemId);
            $difference = $calculatedStock - $oldStock;

            if ($difference != 0) {
                // Create adjustment movement to reconcile
                $this->recordMovement([
                    'item_id' => $itemId,
                    'type' => 'adjustment',
                    'quantity' => $difference,
                    'from_office_id' => null,
                    'to_office_id' => $item->office_id,
                    'performed_by' => auth()->id() ?? 1,
                    'notes' => "Stock reconciliation: Adjusted by {$difference} to match ledger",
                    'reference_number' => 'RECONCILE-' . now()->format('YmdHis'),
                ]);
            }

            return [
                'old_stock' => $oldStock,
                'calculated_stock' => $calculatedStock,
                'difference' => $difference,
                'reconciled' => true,
            ];
        });
    }
}
