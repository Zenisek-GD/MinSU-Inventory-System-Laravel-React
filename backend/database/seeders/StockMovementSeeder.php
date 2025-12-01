<?php

namespace Database\Seeders;

use App\Models\StockMovement;
use App\Models\Item;
use App\Models\User;
use App\Models\Office;
use App\Services\StockService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StockMovementSeeder extends Seeder
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Seed comprehensive stock movements demonstrating all types:
     * - purchase (new items from vendors)
     * - transfer (move between offices)
     * - adjustment (fix discrepancies)
     * - damage (record broken items)
     * - disposal (remove from inventory)
     */
    public function run(): void
    {
        // Get users and offices
        $supplyOfficer = User::where('role', 'supply_officer')->first();
        $admin = User::where('role', 'admin')->first();
        $office1 = Office::where('name', 'Main Office')->first();
        $office2 = Office::where('name', 'Branch Office')->first();

        // Get items
        $laptop = Item::where('qr_code', 'QR001')->first();
        $chair = Item::where('qr_code', 'QR002')->first();
        $printer = Item::where('qr_code', 'QR003')->first();
        $desk = Item::where('qr_code', 'QR004')->first();
        $paper = Item::where('qr_code', 'QR005')->first();

        echo "Creating comprehensive stock movement test data...\n\n";

        // ========================================================================
        // 1. PURCHASE MOVEMENTS (New items received from vendors)
        // ========================================================================
        echo "1. PURCHASE movements (receiving new items):\n";

        if ($laptop && $supplyOfficer && $office1) {
            $movement1 = $this->stockService->recordMovement([
                'item_id' => $laptop->id,
                'type' => 'purchase',
                'quantity' => 10,
                'from_office_id' => null, // From external vendor
                'to_office_id' => $office1->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Initial purchase of Dell laptops for IT department',
                'reference_number' => 'PO-2025-001',
            ]);
            echo "   ✓ Purchased 10 laptops (PO-2025-001) - Stock: {$laptop->fresh()->current_stock}\n";
        }

        if ($chair && $supplyOfficer && $office1) {
            $movement2 = $this->stockService->recordMovement([
                'item_id' => $chair->id,
                'type' => 'purchase',
                'quantity' => 25,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Bulk purchase for office expansion',
                'reference_number' => 'PO-2025-002',
            ]);
            echo "   ✓ Purchased 25 chairs (PO-2025-002) - Stock: {$chair->fresh()->current_stock}\n";
        }

        if ($printer && $admin && $office1) {
            $movement3 = $this->stockService->recordMovement([
                'item_id' => $printer->id,
                'type' => 'purchase',
                'quantity' => 5,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'performed_by' => $admin->id,
                'notes' => 'Annual printer purchase',
                'reference_number' => 'PO-2025-003',
            ]);
            echo "   ✓ Purchased 5 printers (PO-2025-003) - Stock: {$printer->fresh()->current_stock}\n";
        }

        if ($desk && $supplyOfficer && $office2) {
            $movement4 = $this->stockService->recordMovement([
                'item_id' => $desk->id,
                'type' => 'purchase',
                'quantity' => 8,
                'from_office_id' => null,
                'to_office_id' => $office2->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Desks for branch office setup',
                'reference_number' => 'PO-2025-004',
            ]);
            echo "   ✓ Purchased 8 desks (PO-2025-004) - Stock: {$desk->fresh()->current_stock}\n";
        }

        if ($paper && $supplyOfficer && $office1) {
            $movement5 = $this->stockService->recordMovement([
                'item_id' => $paper->id,
                'type' => 'purchase',
                'quantity' => 100,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Quarterly paper supply',
                'reference_number' => 'PO-2025-005',
            ]);
            echo "   ✓ Purchased 100 reams of paper (PO-2025-005) - Stock: {$paper->fresh()->current_stock}\n";
        }

        echo "\n";

        // ========================================================================
        // 2. TRANSFER MOVEMENTS (Move items between offices)
        // ========================================================================
        echo "2. TRANSFER movements (moving between offices):\n";

        if ($laptop && $supplyOfficer && $office1 && $office2) {
            $movement6 = $this->stockService->recordMovement([
                'item_id' => $laptop->id,
                'type' => 'transfer',
                'quantity' => 3,
                'from_office_id' => $office1->id,
                'to_office_id' => $office2->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Transfer laptops to branch office for new employees',
                'reference_number' => 'TRF-2025-001',
            ]);
            echo "   ✓ Transferred 3 laptops: Main Office → Branch Office - Stock: {$laptop->fresh()->current_stock}\n";
        }

        if ($chair && $admin && $office1 && $office2) {
            $movement7 = $this->stockService->recordMovement([
                'item_id' => $chair->id,
                'type' => 'transfer',
                'quantity' => 10,
                'from_office_id' => $office1->id,
                'to_office_id' => $office2->id,
                'performed_by' => $admin->id,
                'notes' => 'Redistribute chairs to branch office',
                'reference_number' => 'TRF-2025-002',
            ]);
            echo "   ✓ Transferred 10 chairs: Main Office → Branch Office - Stock: {$chair->fresh()->current_stock}\n";
        }

        if ($paper && $supplyOfficer && $office1 && $office2) {
            $movement8 = $this->stockService->recordMovement([
                'item_id' => $paper->id,
                'type' => 'transfer',
                'quantity' => 30,
                'from_office_id' => $office1->id,
                'to_office_id' => $office2->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Monthly paper allocation to branch',
                'reference_number' => 'TRF-2025-003',
            ]);
            echo "   ✓ Transferred 30 paper reams: Main Office → Branch Office - Stock: {$paper->fresh()->current_stock}\n";
        }

        echo "\n";

        // ========================================================================
        // 3. ADJUSTMENT MOVEMENTS (Fix stock discrepancies)
        // ========================================================================
        echo "3. ADJUSTMENT movements (fixing discrepancies):\n";

        if ($laptop && $supplyOfficer && $office1) {
            $movement9 = $this->stockService->recordMovement([
                'item_id' => $laptop->id,
                'type' => 'adjustment',
                'quantity' => -1,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Physical count revealed 1 missing laptop - adjusting inventory',
                'reference_number' => 'ADJ-2025-001',
            ]);
            echo "   ✓ Adjustment: -1 laptop (missing found during audit) - Stock: {$laptop->fresh()->current_stock}\n";
        }

        if ($chair && $admin && $office2) {
            $movement10 = $this->stockService->recordMovement([
                'item_id' => $chair->id,
                'type' => 'adjustment',
                'quantity' => 2,
                'from_office_id' => null,
                'to_office_id' => $office2->id,
                'performed_by' => $admin->id,
                'notes' => 'Found 2 extra chairs during stock take that were not recorded',
                'reference_number' => 'ADJ-2025-002',
            ]);
            echo "   ✓ Adjustment: +2 chairs (found during inventory) - Stock: {$chair->fresh()->current_stock}\n";
        }

        if ($paper && $supplyOfficer && $office1) {
            $movement11 = $this->stockService->recordMovement([
                'item_id' => $paper->id,
                'type' => 'adjustment',
                'quantity' => -5,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Correcting data entry error from last month',
                'reference_number' => 'ADJ-2025-003',
            ]);
            echo "   ✓ Adjustment: -5 paper reams (data entry correction) - Stock: {$paper->fresh()->current_stock}\n";
        }

        echo "\n";

        // ========================================================================
        // 4. DAMAGE MOVEMENTS (Record damaged/broken items)
        // ========================================================================
        echo "4. DAMAGE movements (recording broken items):\n";

        if ($laptop && $supplyOfficer && $office2) {
            $movement12 = $this->stockService->recordMovement([
                'item_id' => $laptop->id,
                'type' => 'damage',
                'quantity' => -2,
                'from_office_id' => $office2->id,
                'to_office_id' => null,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Water damage from office leak - laptops beyond repair',
                'reference_number' => 'DMG-2025-001',
            ]);
            echo "   ✓ Damaged: -2 laptops (water damage) - Stock: {$laptop->fresh()->current_stock}\n";
        }

        if ($chair && $admin && $office1) {
            $movement13 = $this->stockService->recordMovement([
                'item_id' => $chair->id,
                'type' => 'damage',
                'quantity' => -3,
                'from_office_id' => $office1->id,
                'to_office_id' => null,
                'performed_by' => $admin->id,
                'notes' => 'Hydraulic mechanism failed, seats collapsed',
                'reference_number' => 'DMG-2025-002',
            ]);
            echo "   ✓ Damaged: -3 chairs (mechanical failure) - Stock: {$chair->fresh()->current_stock}\n";
        }

        if ($printer && $supplyOfficer && $office1) {
            $movement14 = $this->stockService->recordMovement([
                'item_id' => $printer->id,
                'type' => 'damage',
                'quantity' => -1,
                'from_office_id' => $office1->id,
                'to_office_id' => null,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Electrical short circuit - printer not repairable',
                'reference_number' => 'DMG-2025-003',
            ]);
            echo "   ✓ Damaged: -1 printer (electrical failure) - Stock: {$printer->fresh()->current_stock}\n";
        }

        echo "\n";

        // ========================================================================
        // 5. DISPOSAL MOVEMENTS (Remove items from inventory)
        // ========================================================================
        echo "5. DISPOSAL movements (removing from inventory):\n";

        if ($chair && $supplyOfficer && $office1) {
            $movement15 = $this->stockService->recordMovement([
                'item_id' => $chair->id,
                'type' => 'disposal',
                'quantity' => -2,
                'from_office_id' => $office1->id,
                'to_office_id' => null,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Old chairs donated to local community center',
                'reference_number' => 'DIS-2025-001',
            ]);
            echo "   ✓ Disposed: -2 chairs (donated) - Stock: {$chair->fresh()->current_stock}\n";
        }

        if ($paper && $admin && $office2) {
            $movement16 = $this->stockService->recordMovement([
                'item_id' => $paper->id,
                'type' => 'disposal',
                'quantity' => -10,
                'from_office_id' => $office2->id,
                'to_office_id' => null,
                'performed_by' => $admin->id,
                'notes' => 'Water-damaged paper from storage leak - recycled',
                'reference_number' => 'DIS-2025-002',
            ]);
            echo "   ✓ Disposed: -10 paper reams (water damaged, recycled) - Stock: {$paper->fresh()->current_stock}\n";
        }

        if ($desk && $supplyOfficer && $office2) {
            $movement17 = $this->stockService->recordMovement([
                'item_id' => $desk->id,
                'type' => 'disposal',
                'quantity' => -1,
                'from_office_id' => $office2->id,
                'to_office_id' => null,
                'performed_by' => $supplyOfficer->id,
                'notes' => 'Desk with termite damage - disposed',
                'reference_number' => 'DIS-2025-003',
            ]);
            echo "   ✓ Disposed: -1 desk (termite damage) - Stock: {$desk->fresh()->current_stock}\n";
        }

        echo "\n";

        // ========================================================================
        // SUMMARY
        // ========================================================================
        echo "========================================================================\n";
        echo "STOCK MOVEMENT SUMMARY (Ledger System)\n";
        echo "========================================================================\n\n";

        $items = Item::whereIn('qr_code', ['QR001', 'QR002', 'QR003', 'QR004', 'QR005'])->get();

        foreach ($items as $item) {
            $movements = StockMovement::where('item_id', $item->id)->get();

            $purchases = $movements->where('type', 'purchase')->sum('quantity');
            $transfers = $movements->where('type', 'transfer')->sum('quantity');
            $adjustments = $movements->where('type', 'adjustment')->sum('quantity');
            $damages = $movements->where('type', 'damage')->sum('quantity');
            $disposals = $movements->where('type', 'disposal')->sum('quantity');

            $calculatedStock = $purchases + $transfers + $adjustments + $damages + $disposals;

            echo "{$item->name} ({$item->qr_code}):\n";
            echo "  Purchases:    " . str_pad("+{$purchases}", 6, ' ', STR_PAD_LEFT) . "\n";
            echo "  Transfers:    " . str_pad(($transfers >= 0 ? "+{$transfers}" : $transfers), 6, ' ', STR_PAD_LEFT) . "\n";
            echo "  Adjustments:  " . str_pad(($adjustments >= 0 ? "+{$adjustments}" : $adjustments), 6, ' ', STR_PAD_LEFT) . "\n";
            echo "  Damages:      " . str_pad($damages, 6, ' ', STR_PAD_LEFT) . "\n";
            echo "  Disposals:    " . str_pad($disposals, 6, ' ', STR_PAD_LEFT) . "\n";
            echo "  " . str_repeat('-', 20) . "\n";
            echo "  Current Stock: " . str_pad($calculatedStock, 5, ' ', STR_PAD_LEFT) . " {$item->unit}\n";

            // Check stock levels
            if ($calculatedStock <= $item->safety_stock) {
                echo "  ⚠️  ALERT: Below safety stock ({$item->safety_stock})!\n";
            } elseif ($calculatedStock <= $item->reorder_level) {
                echo "  ⚠️  WARNING: Below reorder level ({$item->reorder_level})\n";
            } else {
                echo "  ✓ Stock level healthy\n";
            }

            echo "\n";
        }

        echo "========================================================================\n";
        echo "✓ Seeding completed successfully!\n";
        echo "✓ Total movements created: " . StockMovement::count() . "\n";
        echo "========================================================================\n";
    }
}
