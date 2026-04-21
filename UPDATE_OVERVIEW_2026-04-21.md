# Update Overview — 2026-04-21

## 2.1 Type of Update (check all that apply)

- [x] Bug Fix
- [x] Security Patch
- [x] Feature Enhancement
- [x] Performance Optimization
- [x] UI/UX Improvement
- [x] Database Modification
- [ ] Other:

## 2.2 Purpose of the Update

This update improves inventory tracking and accountability by standardizing location identifiers (`room_id`) and expanding supported location types, adds a **Property Custodian** role, and enhances the Memorandum Receipt (MR) workflow with better tracking, dashboard visibility, PDF export updates, and an admin/supply-officer “Received Supplies” audit log. It also introduces lightweight client-side caching for reference lists (offices/departments/colleges/categories) to reduce repeated API requests.

## 3. Scope of Changes

### 3.1 Modules Affected

| Module Name                                                   | Type of Change                                                  | Description                                                                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| User Registration & Roles                                     | Feature Enhancement / Security Patch                            | Added `property_custodia` role support and validation/limits for privileged roles.                                          |
| Dashboard                                                     | Feature Enhancement / UI/UX Improvement                         | Added backend stats + MR audit timeline endpoints and updated role-based dashboards/routes.                                 |
| Location Management (Offices/Rooms)                           | Feature Enhancement / UI/UX Improvement / Database Modification | Added `room_id` and related metadata, expanded office types, and added management UI + analytics.                           |
| Items & Inventory                                             | Bug Fix / Feature Enhancement / Database Modification           | Improved item tracking (borrow + MR context), safer stock handling, and office relationship changes (nullable `office_id`). |
| Memorandum Receipt (MR) Workflow                              | Feature Enhancement / UI/UX Improvement                         | Refined MR listing/permissions, enhanced detail/form UI, audit log visibility, and PDF output template.                     |
| Received Supplies (MR Acceptance Log)                         | Feature Enhancement / Security Patch                            | Added management-only log of MR “accepted” events, with filtering and pagination.                                           |
| Reference Data APIs (Colleges/Departments/Categories/Offices) | Performance Optimization                                        | Added request caching + invalidation to reduce repeated reads and keep lists consistent after mutations.                    |
| Reports & Notifications                                       | Bug Fix / Enhancement                                           | Small report adjustments and improved alert aggregation logic compatibility with updated pages.                             |

### 3.2 Files Modified

| File Name                                                    | File Path                            | Description of Change                                                                                                             |
| ------------------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| ItemController.php                                           | backend/app/Http/Controllers/Api/V1/ | Enhanced item listing to include current borrow + MR tracking context; improved validation and safer stock handling.              |
| MemorandumReceiptController.php                              | backend/app/Http/Controllers/Api/V1/ | Updated MR listing authorization/filtering, auto-detected form type (ICS/PAR), improved audit logging and workflow endpoints.     |
| DashboardController.php                                      | backend/app/Http/Controllers/Api/V1/ | **Added** dashboard stats endpoint and MR audit timeline endpoint with role-based visibility.                                     |
| ReceivedSuppliesController.php                               | backend/app/Http/Controllers/Api/V1/ | **Added** management-only “received supplies” (MR acceptance) log endpoint with filters + pagination.                             |
| OfficeController.php                                         | backend/app/Http/Controllers/        | Added location validations, standardized `room_id` inference/validation, and expanded office types for location management.       |
| ReportsController.php                                        | backend/app/Http/Controllers/        | Minor adjustments to reports + alert aggregation compatibility with updated UI routing.                                           |
| RegisterUserRequest.php                                      | backend/app/Http/Requests/Api/V1/    | Added `property_custodia` to role validation and preserved limits on privileged roles.                                            |
| CreateMemorandumReceiptRequest.php                           | backend/app/Http/Requests/           | Updated authorization to allow `property_custodia` to create MRs; validation aligned with MR items rules.                         |
| UpdateMemorandumReceiptRequest.php                           | backend/app/Http/Requests/           | Updated authorization logic for MR updates and kept validation rules aligned with editable fields.                                |
| Item.php                                                     | backend/app/Models/                  | Added automatic serial number generation when missing; expanded MR relationships and helper methods.                              |
| MemorandumReceipt.php                                        | backend/app/Models/                  | Updated constants/workflow utilities (form types, thresholds, statuses) and MR number generation logic.                           |
| Office.php                                                   | backend/app/Models/                  | Expanded fillable fields for hierarchy + standardized identifiers (`room_id`, building/floor/room).                               |
| User.php                                                     | backend/app/Models/                  | Added role constants and helper/scope methods including `property_custodia`.                                                      |
| LocationService.php                                          | backend/app/Services/                | **Added** normalization + generation/validation helpers for standardized `room_id`.                                               |
| DatabaseSeeder.php                                           | backend/database/seeders/            | Seeded sample hierarchy data and added a sample `property_custodia` user.                                                         |
| 2026_04_15_000000_add_property_custodia_role.php             | backend/database/migrations/         | **Added** migration to expand `users.role` enum to include `property_custodia`.                                                   |
| 2026_04_20_000001_add_room_id_and_expand_office_types.php    | backend/database/migrations/         | **Added** `offices.room_id/year_level/assigned_professor` and expanded `offices.type` enum values.                                |
| 2026_04_20_000002_make_office_id_nullable_in_items_table.php | backend/database/migrations/         | **Added** migration to make `items.office_id` nullable and use `ON DELETE SET NULL`.                                              |
| memorandum_receipt_pdf.blade.php                             | backend/resources/views/             | Updated MR PDF template layout and added form type (ICS/PAR) labeling.                                                            |
| api.php                                                      | backend/routes/                      | Added new dashboard + received supplies routes; updated office routing (public list + protected CRUD).                            |
| App.jsx                                                      | frontend/src/                        | Updated routing (role-based landing) and added route for Received Supplies Log.                                                   |
| Sidebar.jsx                                                  | frontend/src/components/Layout/      | Added navigation entries for new/updated pages and role support (including property custodian).                                   |
| LocationManager.jsx                                          | frontend/src/components/             | **Added** location CRUD UI including type/category filters and editing standardized room fields.                                  |
| LocationReports.jsx                                          | frontend/src/components/             | **Added** location analytics (totals, missing `room_id`, top types).                                                              |
| LocationSelector.jsx                                         | frontend/src/components/             | Updated office display/selection behavior to support standardized location labeling.                                              |
| OfficeChip.jsx                                               | frontend/src/components/UI/          | Updated office label rendering to include standardized `room_id` where available.                                                 |
| MemorandumReceiptForm.jsx                                    | frontend/src/components/             | Updated MR form behavior and fields to match backend workflow + form type rules.                                                  |
| ReceiveItemsDialog.jsx                                       | frontend/src/components/             | Minor adjustments to receiving flow and MR acceptance UX integration.                                                             |
| AddStockMovementDialog.jsx                                   | frontend/src/components/             | Minor adjustments aligned with updated items/locations behavior.                                                                  |
| ProtectedRoute.jsx                                           | frontend/src/components/common/      | Updated route guarding/role handling to match new dashboard routing behavior.                                                     |
| Locations.jsx                                                | frontend/src/pages/                  | Reworked Locations page into tabbed management + analytics view using new components.                                             |
| ItemsInventory.jsx                                           | frontend/src/pages/                  | Improved items/inventory UI flows (add/edit/transfer/archive) and compatibility with updated backend item model/relationships.    |
| Dashboard.jsx                                                | frontend/src/pages/                  | Switched to role-based dashboard rendering using the updated v2 dashboard components.                                             |
| AdminDashboard_v2.jsx                                        | frontend/src/pages/Dashboard/        | Adjusted admin dashboard behavior to use new dashboard endpoints and updated navigation targets.                                  |
| StaffDashboard.jsx                                           | frontend/src/pages/                  | Updated staff dashboard page behavior/links to match the new role routing model.                                                  |
| Borrows.jsx                                                  | frontend/src/pages/                  | Updated borrow requests page to align with consolidated routing and newer UI structure.                                           |
| Login.jsx                                                    | frontend/src/pages/                  | Minor adjustments for updated role routing and/or session behavior.                                                               |
| MemorandumReceipts.jsx                                       | frontend/src/pages/                  | Minor adjustments for MR list compatibility with updated API response shapes.                                                     |
| MemorandumReceiptDetail.jsx                                  | frontend/src/pages/                  | Major MR detail improvements: richer status handling, audit log visibility, and updated actions (approve/accept/return/transfer). |
| MyRequests.jsx                                               | frontend/src/pages/                  | Updated staff request list behavior to align with new MR/borrow routing and filtering.                                            |
| RequestItem.jsx                                              | frontend/src/pages/                  | Updated request item flow and UI logic to match current inventory model behavior.                                                 |
| ReceivedSuppliesLog.jsx                                      | frontend/src/pages/                  | **Added** management UI to view MR acceptance events and drill into the MR details.                                               |
| receivedSupplies.js                                          | frontend/src/api/                    | **Added** API wrapper for the received supplies log endpoint.                                                                     |
| requestCache.js                                              | frontend/src/api/                    | **Added** simple in-memory GET caching + in-flight dedupe + invalidation helpers.                                                 |
| offices.js                                                   | frontend/src/api/                    | Added cached office listing + cache invalidation on office mutations.                                                             |
| departments.js                                               | frontend/src/api/                    | Added cached department listing + cache invalidation on department mutations.                                                     |
| colleges.js                                                  | frontend/src/api/                    | Added cached college listing + cache invalidation on college mutations.                                                           |
| category.js                                                  | frontend/src/api/                    | Added cached categories listing + cache invalidation on category mutations.                                                       |
| dashboard.js                                                 | frontend/src/api/                    | Added API helpers for dashboard stats and MR timeline endpoints.                                                                  |
| memorandumReceipt.js                                         | frontend/src/api/                    | Updated MR API wrappers (query params support, audit log, accept/return/transfer/export).                                         |
| formatOfficeLabel.js                                         | frontend/src/utils/                  | **Added** shared helpers to format office/location labels and tooltips consistently.                                              |

**Files removed (cleanup / consolidation):**

- frontend/src/pages/BorrowRequestPage.jsx (removed; consolidated into updated borrow flows)
- frontend/src/pages/CreateMemorandumReceipt.jsx (removed; MR creation handled via updated MR pages/forms)
- frontend/src/pages/Dashboard/AdminDashboard.jsx (removed; replaced by AdminDashboard_v2.jsx)
- frontend/src/pages/Dashboard/StaffDashboard.jsx (removed legacy version)
- frontend/src/pages/Dashboard/SupplyOfficerDashboard.jsx (removed legacy version)
- frontend/src/pages/Dashboard/SupplyOfficerDashboard_v2.jsx (removed; consolidated with admin dashboard pattern)
- frontend/src/pages/Inventory.jsx (removed; consolidated into Items & Inventory)
- frontend/src/pages/Items.jsx (removed; consolidated into ItemsInventory.jsx)
- frontend/src/pages/LocationsImproved.jsx (removed; consolidated into Locations.jsx + components)
- frontend/src/pages/StockDashboard_v2.jsx (removed; consolidated into StockDashboard)

### 3.3 Database Changes (check all that apply)

- [ ] No database changes
- [x] Schema Modified
- [ ] New Table Added
- [x] Column Updated

**Database change details**

- **Users**: Expanded `users.role` enum to include `property_custodia` via migration `2026_04_15_000000_add_property_custodia_role.php`.
- **Offices**: Added `offices.room_id` (nullable, unique), plus `year_level` and `assigned_professor`, and expanded `offices.type` enum to support additional location types used by the UI via `2026_04_20_000001_add_room_id_and_expand_office_types.php`.
- **Items**: Updated `items.office_id` to be nullable and changed FK behavior to `ON DELETE SET NULL` via `2026_04_20_000002_make_office_id_nullable_in_items_table.php`.
