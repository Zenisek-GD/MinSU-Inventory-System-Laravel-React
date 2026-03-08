<?php

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\OfficeController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ItemController;
use App\Http\Controllers\Api\V1\PurchaseRequestController;
use App\Http\Controllers\Api\V1\MemorandumReceiptController;
use App\Http\Controllers\Api\V1\ScannerSessionController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\CollegeController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\OfficeController as HierarchyOfficeController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/users/role-counts', [AuthController::class, 'roleCounts']);

    // Colleges - public access for dropdown selectors
    Route::get('/colleges', [CollegeController::class, 'index']);

    // Departments - public access for dropdown selectors
    Route::get('/departments', [DepartmentController::class, 'index']);

    // Offices - public access for item location display
    Route::get('/offices', [HierarchyOfficeController::class, 'index']);

    // Mobile Scanner Routes (no authentication required)
    Route::post('/scanner-sessions/join', [\App\Http\Controllers\Api\V1\ScannerSessionController::class, 'joinSession']);
    Route::post('/scanner-sessions/submit-scan', [\App\Http\Controllers\Api\V1\ScannerSessionController::class, 'submitScan']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/profile', [AuthController::class, 'profile']);

        // College resource routes
        Route::post('/colleges', [CollegeController::class, 'store']);
        Route::get('/colleges/{college}', [CollegeController::class, 'show']);
        Route::put('/colleges/{college}', [CollegeController::class, 'update']);
        Route::delete('/colleges/{college}', [CollegeController::class, 'destroy']);

        // Department resource routes
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::get('/departments/{department}', [DepartmentController::class, 'show']);
        Route::put('/departments/{department}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);

        // Office hierarchy resource routes
        Route::post('/offices', [HierarchyOfficeController::class, 'store']);
        Route::get('/offices/{office}', [HierarchyOfficeController::class, 'show']);
        Route::put('/offices/{office}', [HierarchyOfficeController::class, 'update']);
        Route::delete('/offices/{office}', [HierarchyOfficeController::class, 'destroy']);

        // Office resource routes (legacy)
        Route::apiResource('offices-legacy', OfficeController::class);
        // Category resource routes
        Route::apiResource('categories', CategoryController::class);
        // User resource routes
        Route::apiResource('users', \App\Http\Controllers\Api\V1\UserController::class);
        // Item resource routes - QR lookup must come before apiResource
        Route::get('items/qr/{qr_code}', [ItemController::class, 'showByQr']);
        Route::post('items/{item}/transfer', [ItemController::class, 'transfer']);
        Route::post('items/{item}/archive', [ItemController::class, 'archive']);
        Route::apiResource('items', ItemController::class);

        // Memorandum Receipt resource routes
        Route::apiResource('memorandum-receipts', MemorandumReceiptController::class);
        // Custom routes for memorandum receipt workflow
        Route::post('memorandum-receipts/{id}/update-progress', [MemorandumReceiptController::class, 'updateProgress']);
        Route::post('memorandum-receipts/{id}/sign', [MemorandumReceiptController::class, 'sign']);
        Route::post('memorandum-receipts/{id}/approve', [MemorandumReceiptController::class, 'approve']);
        Route::put('memorandum-receipts/{id}/reject', [MemorandumReceiptController::class, 'reject']);
        Route::post('memorandum-receipts/{id}/accept', [MemorandumReceiptController::class, 'accept']);
        Route::post('memorandum-receipts/{id}/return', [MemorandumReceiptController::class, 'returnEquipment']);
        Route::get('memorandum-receipts/{id}/audit-log', [MemorandumReceiptController::class, 'auditLog']);
        Route::get('memorandum-receipts/{id}/export-pdf', [MemorandumReceiptController::class, 'exportPDF']);
        Route::post('memorandum-receipts/batch-approve', [MemorandumReceiptController::class, 'batchApprove']);

        // Borrow resource routes
        Route::apiResource('borrows', \App\Http\Controllers\Api\V1\BorrowController::class);
        // Custom approve/reject routes for borrows
        Route::put('borrows/{borrowRecord}/approve', [\App\Http\Controllers\Api\V1\BorrowController::class, 'approve']);
        Route::put('borrows/{borrowRecord}/reject', [\App\Http\Controllers\Api\V1\BorrowController::class, 'reject']);
        // Return processing for borrows (record returned item + stock movement)
        Route::put('borrows/{borrowRecord}/return', [\App\Http\Controllers\Api\V1\BorrowController::class, 'returnItem']);
        // Stock movements
        Route::get('stock-movements/item/{itemId}/summary', [\App\Http\Controllers\Api\V1\StockMovementController::class, 'itemSummary']);
        Route::post('stock-movements/item/{itemId}/reconcile', [\App\Http\Controllers\Api\V1\StockMovementController::class, 'reconcile']);
        Route::apiResource('stock-movements', \App\Http\Controllers\Api\V1\StockMovementController::class)->only(['index', 'store']);

        // Scanner Sessions (Mobile-to-Desktop QR Scanner)
        Route::post('/scanner-sessions', [\App\Http\Controllers\Api\V1\ScannerSessionController::class, 'createSession']);
        Route::get('/scanner-sessions/{sessionId}', [\App\Http\Controllers\Api\V1\ScannerSessionController::class, 'getSessionStatus']);
        Route::post('/scanner-sessions/{sessionId}/close', [\App\Http\Controllers\Api\V1\ScannerSessionController::class, 'closeSession']);
        Route::get('/scanner-sessions/{sessionId}/scans', [\App\Http\Controllers\Api\V1\ScannerSessionController::class, 'getNewScans']);
        Route::patch('/scanner-scans/{scanId}/processed', [\App\Http\Controllers\Api\V1\ScannerSessionController::class, 'markScanProcessed']);

        // Report routes
        Route::get('reports/items', [ReportsController::class, 'itemsReport']);
        Route::get('reports/borrows', [ReportsController::class, 'borrowsReport']);
        Route::get('reports/purchase-requests', [ReportsController::class, 'purchaseRequestsReport']);
        Route::get('reports/stock-levels', [ReportsController::class, 'stockLevelsReport']);
        Route::get('reports/alerts', [ReportsController::class, 'notificationAlerts']);
    });
});