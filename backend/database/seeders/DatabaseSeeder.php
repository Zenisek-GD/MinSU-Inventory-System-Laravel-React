<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Office;
use App\Models\Category;
use App\Models\Item;
use App\Models\BorrowRecord;
use App\Models\StockMovement;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create offices
        $office1 = Office::create([
            'name' => 'Main Office',
            'location' => 'Floor 1',
            'description' => 'Central office location',
            'qr_code' => 'OFFICE-001',
        ]);

        $office2 = Office::create([
            'name' => 'Branch Office',
            'location' => 'Floor 2',
            'description' => 'Branch office location',
            'qr_code' => 'OFFICE-002',
        ]);

        // Create categories
        $category1 = Category::create(['name' => 'Electronics']);
        $category2 = Category::create(['name' => 'Furniture']);
        $category3 = Category::create(['name' => 'Office Supplies']);

        // Create sample items
        Item::create([
            'name' => 'Dell Laptop',
            'description' => 'Dell XPS 15 Laptop',
            'category_id' => $category1->id,
            'office_id' => $office1->id,
            'qr_code' => 'QR001',
            'serial_number' => 'SN001',
            'condition' => 'Good',
            'status' => 'Available',
            'purchase_date' => now()->subMonths(6),
            'purchase_price' => 1200.00,
            'reorder_level' => 5,
            'safety_stock' => 2,
            'unit' => 'Unit',
        ]);

        Item::create([
            'name' => 'Office Chair',
            'description' => 'Ergonomic Office Chair',
            'category_id' => $category2->id,
            'office_id' => $office1->id,
            'qr_code' => 'QR002',
            'serial_number' => 'SN002',
            'condition' => 'Good',
            'status' => 'Available',
            'purchase_date' => now()->subMonths(3),
            'purchase_price' => 350.00,
            'reorder_level' => 10,
            'safety_stock' => 3,
            'unit' => 'Unit',
        ]);

        Item::create([
            'name' => 'Printer',
            'description' => 'HP Color Printer',
            'category_id' => $category1->id,
            'office_id' => $office1->id,
            'qr_code' => 'QR003',
            'serial_number' => 'SN003',
            'condition' => 'Good',
            'status' => 'Available',
            'purchase_date' => now()->subMonths(12),
            'purchase_price' => 500.00,
            'reorder_level' => 3,
            'safety_stock' => 1,
            'unit' => 'Unit',
        ]);

        Item::create([
            'name' => 'Desk',
            'description' => 'Executive Wooden Desk',
            'category_id' => $category2->id,
            'office_id' => $office2->id,
            'qr_code' => 'QR004',
            'serial_number' => 'SN004',
            'condition' => 'Excellent',
            'status' => 'Available',
            'purchase_date' => now()->subMonths(2),
            'purchase_price' => 800.00,
            'reorder_level' => 5,
            'safety_stock' => 2,
            'unit' => 'Unit',
        ]);

        Item::create([
            'name' => 'Paper Ream',
            'description' => 'A4 Paper Ream (500 sheets)',
            'category_id' => $category3->id,
            'office_id' => $office2->id,
            'qr_code' => 'QR005',
            'serial_number' => 'SN005',
            'condition' => 'Good',
            'status' => 'Available',
            'purchase_date' => now()->subDays(30),
            'purchase_price' => 5.00,
            'reorder_level' => 50,
            'safety_stock' => 20,
            'unit' => 'Ream',
        ]);

        // Create test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Create admin user
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'office_id' => $office1->id,
        ]);

        // Create supply officer user
        $supplyOfficer = User::create([
            'name' => 'Supply Officer',
            'email' => 'supply@example.com',
            'password' => bcrypt('password'),
            'role' => 'supply_officer',
            'office_id' => $office1->id,
        ]);

        // Create staff user
        $staffUser = User::create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => bcrypt('password'),
            'role' => 'staff',
            'office_id' => $office1->id,
        ]);

        // Create sample borrow records
        $laptop = Item::where('name', 'Dell Laptop')->first();
        $chair = Item::where('name', 'Office Chair')->first();
        $printer = Item::where('name', 'Printer')->first();

        if ($laptop) {
            BorrowRecord::create([
                'item_id' => $laptop->id,
                'borrowed_by' => $staffUser->id,
                'approved_by' => $supplyOfficer->id,
                'borrow_date' => now()->subDays(5),
                'expected_return_date' => now()->addDays(5),
                'actual_return_date' => null,
                'purpose' => 'Training and development',
                'condition_before' => 'Good',
                'condition_after' => null,
                'status' => 'Approved',
                'notes' => 'User is attending training program',
            ]);
        }

        if ($chair) {
            BorrowRecord::create([
                'item_id' => $chair->id,
                'borrowed_by' => $staffUser->id,
                'approved_by' => $supplyOfficer->id,
                'borrow_date' => now()->subDays(10),
                'expected_return_date' => now()->subDays(3),
                'actual_return_date' => now()->subDays(2),
                'purpose' => 'Temporary office setup',
                'condition_before' => 'Good',
                'condition_after' => 'Good',
                'status' => 'Returned',
                'notes' => 'Returned in good condition',
            ]);
        }

        if ($printer) {
            BorrowRecord::create([
                'item_id' => $printer->id,
                'borrowed_by' => $staffUser->id,
                'approved_by' => null,
                'borrow_date' => now()->subDays(2),
                'expected_return_date' => now()->addDays(7),
                'actual_return_date' => null,
                'purpose' => 'Department printing needs',
                'condition_before' => null,
                'condition_after' => null,
                'status' => 'Pending',
                'notes' => null,
            ]);
        }

        // Create sample stock movements to demonstrate the feature
        // Incoming movements (stock additions)
        if ($laptop) {
            StockMovement::create([
                'item_id' => $laptop->id,
                'change_qty' => 5,
                'movement_type' => 'incoming',
                'reason' => 'purchase',
                'reference_type' => 'purchase_order',
                'reference_id' => 1,
                'performed_by' => $supplyOfficer->id,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'notes' => 'Initial stock received',
            ]);
        }

        if ($chair) {
            StockMovement::create([
                'item_id' => $chair->id,
                'change_qty' => 10,
                'movement_type' => 'incoming',
                'reason' => 'purchase',
                'reference_type' => 'purchase_order',
                'reference_id' => 2,
                'performed_by' => $supplyOfficer->id,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'notes' => 'Bulk purchase for office setup',
            ]);
        }

        if ($printer) {
            StockMovement::create([
                'item_id' => $printer->id,
                'change_qty' => 3,
                'movement_type' => 'incoming',
                'reason' => 'purchase',
                'reference_type' => 'purchase_order',
                'reference_id' => 3,
                'performed_by' => $supplyOfficer->id,
                'from_office_id' => null,
                'to_office_id' => $office1->id,
                'notes' => 'Annual purchase',
            ]);
        }

        // Outgoing movements (simulating borrows)
        if ($laptop) {
            StockMovement::create([
                'item_id' => $laptop->id,
                'change_qty' => -1,
                'movement_type' => 'outgoing',
                'reason' => 'borrow',
                'reference_type' => 'borrow',
                'reference_id' => 1,
                'performed_by' => $supplyOfficer->id,
                'from_office_id' => $office1->id,
                'to_office_id' => $staffUser->id,
                'notes' => 'Borrowed by staff',
            ]);
        }

        // Adjustment movements (inventory corrections)
        if ($chair) {
            StockMovement::create([
                'item_id' => $chair->id,
                'change_qty' => -2,
                'movement_type' => 'adjustment',
                'reason' => 'damaged',
                'reference_type' => 'damage_report',
                'reference_id' => 1,
                'performed_by' => $supplyOfficer->id,
                'from_office_id' => $office1->id,
                'to_office_id' => null,
                'notes' => 'Chairs damaged beyond repair',
            ]);
        }
    }
}
