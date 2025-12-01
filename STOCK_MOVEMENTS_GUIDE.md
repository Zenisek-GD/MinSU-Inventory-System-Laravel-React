# Stock Movements Tracking (Ledger System) - Implementation Guide

## Overview

This system implements a **ledger-based inventory tracking** system that records every stock transaction in a `stock_movements` table, providing a complete audit trail and ensuring accuracy through transaction history.

## Why Ledger System?

### Traditional Inventory (Problem)

```php
// Just update the number
$item->current_stock = 50;  // Where did this come from? No history!
```

### Ledger System (Solution)

```php
// Record EVERY transaction
StockMovement::create([
    'item_id' => $item->id,
    'type' => 'purchase',
    'quantity' => +50,
    'notes' => 'Received from PO-2025-001'
]);
// Current stock = SUM of all movements = Full audit trail!
```

### Benefits

✅ **Complete Audit Trail** - Know exactly what happened to every item  
✅ **Reversible** - Can trace and correct any discrepancy  
✅ **Accountability** - Track who performed each movement  
✅ **Compliance** - Meet audit requirements  
✅ **Transparency** - Stock changes are documented

---

## Database Structure

### Stock Movements Table Schema

```sql
CREATE TABLE stock_movements (
    id BIGINT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    type ENUM('purchase', 'transfer', 'adjustment', 'damage', 'disposal'),
    quantity DECIMAL(12,2),  -- Positive for additions, negative for reductions
    from_office_id BIGINT NULLABLE,
    to_office_id BIGINT NULLABLE,
    performed_by BIGINT NULLABLE,
    reference_number VARCHAR(255) NULLABLE,  -- PO number, invoice, etc.
    notes TEXT NULLABLE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Movement Types Explained

#### 1. PURCHASE (New items from vendors)

```php
[
    'type' => 'purchase',
    'quantity' => +10,              // Positive: adds to inventory
    'from_office_id' => null,       // From external vendor
    'to_office_id' => 1,            // To receiving office
    'reference_number' => 'PO-2025-001'
]
```

**Use Case**: Receiving new items from suppliers  
**Effect**: Increases `current_stock`

#### 2. TRANSFER (Move between offices)

```php
[
    'type' => 'transfer',
    'quantity' => 5,                // Amount transferred
    'from_office_id' => 1,          // Source location
    'to_office_id' => 2,            // Destination location
    'reference_number' => 'TRF-2025-001'
]
```

**Use Case**: Redistribute items between locations  
**Effect**: Changes item's `office_id`, neutral to total stock

#### 3. ADJUSTMENT (Fix discrepancies)

```php
[
    'type' => 'adjustment',
    'quantity' => -3,               // Negative: found missing
    'notes' => 'Physical count revealed discrepancy'
]
```

**Use Case**: Correct inventory after physical count  
**Effect**: Positive adds, negative subtracts from `current_stock`

#### 4. DAMAGE (Record broken items)

```php
[
    'type' => 'damage',
    'quantity' => -2,               // Always negative
    'notes' => 'Water damage from office leak',
    'reference_number' => 'DMG-2025-001'
]
```

**Use Case**: Document damaged/broken items  
**Effect**: Reduces `current_stock`, marks item as damaged

#### 5. DISPOSAL (Remove from inventory)

```php
[
    'type' => 'disposal',
    'quantity' => -1,               // Always negative
    'notes' => 'Donated to charity',
    'reference_number' => 'DIS-2025-001'
]
```

**Use Case**: Items donated, scrapped, or thrown away  
**Effect**: Reduces `current_stock`, marks as disposed if zero

---

## Stock Calculation Logic

### How Current Stock is Calculated

```php
Current Stock = SUM(all stock_movements.quantity) for that item
```

### Example Flow

```
Item: Dell Laptop (ID: 1)

Movement History:
1. Purchase:    +10 laptops  → Stock: 10
2. Transfer:    +3 laptops   → Stock: 13  (received from another office)
3. Adjustment:  -1 laptop    → Stock: 12  (missing during audit)
4. Damage:      -2 laptops   → Stock: 10  (water damaged)
5. Disposal:    0 laptops    → Stock: 10  (no disposal yet)

Final Stock: 10 + 3 - 1 - 2 = 10 laptops
```

---

## Implementation

### StockService.php - Core Business Logic

```php
<?php

namespace App\Services;

use App\Models\StockMovement;
use App\Models\Item;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Record a stock movement with full ledger implementation
     */
    public function recordMovement(array $data)
    {
        return DB::transaction(function () use ($data) {
            // 1. Create ledger entry
            $movement = StockMovement::create($data);

            // 2. Get item and update stock
            $item = Item::findOrFail($data['item_id']);
            $item->current_stock += $data['quantity'];

            // 3. Update item status based on movement type
            if ($data['type'] === 'damage' && $data['quantity'] < 0) {
                $item->status = 'Lost';
                $item->condition = 'Damaged';
            }

            // 4. Update location for transfers
            if ($data['type'] === 'transfer' && isset($data['to_office_id'])) {
                $item->office_id = $data['to_office_id'];
            }

            // 5. Save changes
            $item->save();

            // 6. Check reorder levels
            if ($item->current_stock <= $item->reorder_level) {
                Log::warning("Low stock: {$item->name}");
            }

            return $movement;
        });
    }

    /**
     * Calculate stock from ledger (for verification)
     */
    public function calculateStockFromLedger(int $itemId): int
    {
        return StockMovement::where('item_id', $itemId)
            ->sum('quantity');
    }

    /**
     * Reconcile stock if discrepancy found
     */
    public function reconcileStock(int $itemId): array
    {
        $item = Item::findOrFail($itemId);
        $ledgerStock = $this->calculateStockFromLedger($itemId);
        $difference = $ledgerStock - $item->current_stock;

        if ($difference != 0) {
            // Create adjustment to fix discrepancy
            $this->recordMovement([
                'item_id' => $itemId,
                'type' => 'adjustment',
                'quantity' => $difference,
                'notes' => "Reconciliation: Fixed {$difference} unit discrepancy",
            ]);
        }

        return [
            'old_stock' => $item->current_stock,
            'ledger_stock' => $ledgerStock,
            'difference' => $difference,
        ];
    }
}
```

---

## API Endpoints

### 1. Get All Stock Movements

```http
GET /api/v1/stock-movements
Authorization: Bearer {token}

Query Parameters:
- item_id: Filter by item
- type: Filter by movement type
- from_date: Filter from date
- to_date: Filter to date
```

**Response:**

```json
[
  {
    "id": 1,
    "item_id": 1,
    "type": "purchase",
    "quantity": "10.00",
    "from_office_id": null,
    "to_office_id": 1,
    "performed_by": 2,
    "reference_number": "PO-2025-001",
    "notes": "Initial purchase",
    "created_at": "2025-12-01T10:00:00.000000Z",
    "item": { "name": "Dell Laptop" },
    "performedBy": { "name": "Supply Officer" }
  }
]
```

### 2. Create Stock Movement

```http
POST /api/v1/stock-movements
Authorization: Bearer {token}
Content-Type: application/json

{
    "item_id": 1,
    "type": "purchase",
    "quantity": 10,
    "to_office_id": 1,
    "reference_number": "PO-2025-001",
    "notes": "New laptops received"
}
```

### 3. Get Item Stock Summary

```http
GET /api/v1/stock-movements/item/{itemId}/summary
Authorization: Bearer {token}
```

**Response:**

```json
{
  "item_id": 1,
  "total_movements": 5,
  "purchases": 10,
  "transfers": 3,
  "adjustments": -1,
  "damages": -2,
  "disposals": 0,
  "calculated_stock": 10
}
```

### 4. Reconcile Item Stock

```http
POST /api/v1/stock-movements/item/{itemId}/reconcile
Authorization: Bearer {token}
```

---

## Testing with Seeder

Run the comprehensive test seeder:

```bash
php artisan db:seed --class=StockMovementSeeder
```

This creates:

- **5 purchase movements** (receiving from vendors)
- **3 transfer movements** (between offices)
- **3 adjustment movements** (fixing discrepancies)
- **3 damage movements** (recording broken items)
- **3 disposal movements** (removing from inventory)

### Seeder Output Example

```
Creating comprehensive stock movement test data...

1. PURCHASE movements (receiving new items):
   ✓ Purchased 10 laptops (PO-2025-001) - Stock: 10.00
   ✓ Purchased 25 chairs (PO-2025-002) - Stock: 25.00

2. TRANSFER movements (moving between offices):
   ✓ Transferred 3 laptops: Main Office → Branch Office - Stock: 13.00

3. ADJUSTMENT movements (fixing discrepancies):
   ✓ Adjustment: -1 laptop (missing found during audit) - Stock: 12.00

4. DAMAGE movements (recording broken items):
   ✓ Damaged: -2 laptops (water damage) - Stock: 10.00

5. DISPOSAL movements (removing from inventory):
   ✓ Disposed: -2 chairs (donated) - Stock: 32.00

========================================================================
STOCK MOVEMENT SUMMARY (Ledger System)
========================================================================

Dell Laptop (QR001):
  Purchases:       +10
  Transfers:        +3
  Adjustments:      -1
  Damages:          -2
  Disposals:         0
  --------------------
  Current Stock:    10 Unit
  ✓ Stock level healthy
```

---

## Best Practices

### ✅ DO

- **Always use StockService** for movements (ensures transaction safety)
- **Include reference numbers** (PO, invoice, damage report ID)
- **Add descriptive notes** for audit trail
- **Use positive/negative quantities** appropriately
- **Reconcile regularly** to catch discrepancies early

### ❌ DON'T

- **Never update `current_stock` directly** (breaks audit trail)
- **Don't skip transactions** (every change must be recorded)
- **Don't reuse reference numbers** (uniqueness helps tracking)
- **Avoid vague notes** like "adjustment" (be specific)

---

## Troubleshooting

### Stock Doesn't Match Reality

```php
// Use reconciliation to fix
$service = new StockService();
$result = $service->reconcileStock($itemId);
// Creates adjustment movement to fix discrepancy
```

### Find Missing Items

```sql
SELECT item_id, SUM(quantity) as ledger_stock,
       items.current_stock,
       SUM(quantity) - items.current_stock as difference
FROM stock_movements
JOIN items ON items.id = stock_movements.item_id
GROUP BY item_id
HAVING difference != 0;
```

### Audit Specific Item

```sql
SELECT created_at, type, quantity, reference_number, notes,
       SUM(quantity) OVER (ORDER BY created_at) as running_total
FROM stock_movements
WHERE item_id = 1
ORDER BY created_at;
```

---

## Future Enhancements

- [ ] Batch import movements from CSV
- [ ] Email alerts for low stock levels
- [ ] Approval workflow for large movements
- [ ] Integration with accounting system
- [ ] Barcode scanning for faster data entry
- [ ] Mobile app for warehouse staff

---

## Related Documentation

- [Setup Guide](SETUP_GUIDE.txt) - System installation
- [API Documentation](docs/api.md) - All endpoints
- [Database Schema](docs/database.md) - Table structures

---

## Support

For questions or issues:

- GitHub Issues: https://github.com/Zenisek-GD/MinSU-Inventory-System-Laravel-React/issues
- Email: support@example.com
