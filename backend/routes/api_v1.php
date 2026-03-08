<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CollegeController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\BorrowRequestController;
use App\Http\Controllers\Api\V1\ScannerSessionController;

// Scanner Sessions (Mobile-to-Desktop QR Scanner)
// Desktop creates session (authenticated)
Route::middleware('auth:sanctum')->post('/scanner-sessions', [ScannerSessionController::class, 'createSession']);
Route::middleware('auth:sanctum')->get('/scanner-sessions/{sessionId}', [ScannerSessionController::class, 'getSessionStatus']);
Route::middleware('auth:sanctum')->post('/scanner-sessions/{sessionId}/close', [ScannerSessionController::class, 'closeSession']);
Route::middleware('auth:sanctum')->get('/scanner-sessions/{sessionId}/scans', [ScannerSessionController::class, 'getNewScans']);
Route::middleware('auth:sanctum')->patch('/scanner-scans/{scanId}/processed', [ScannerSessionController::class, 'markScanProcessed']);

// Mobile joins session and submits scans (no authentication required)
Route::post('/scanner-sessions/join', [ScannerSessionController::class, 'joinSession']);
Route::post('/scanner-sessions/submit-scan', [ScannerSessionController::class, 'submitScan']);

// Colleges
Route::get('/colleges', [CollegeController::class, 'index']);
Route::post('/colleges', [CollegeController::class, 'store']);
Route::get('/colleges/{college}', [CollegeController::class, 'show']);
Route::put('/colleges/{college}', [CollegeController::class, 'update']);
Route::delete('/colleges/{college}', [CollegeController::class, 'destroy']);

// Departments
Route::get('/departments', [DepartmentController::class, 'index']);
Route::post('/departments', [DepartmentController::class, 'store']);
Route::get('/departments/{department}', [DepartmentController::class, 'show']);
Route::put('/departments/{department}', [DepartmentController::class, 'update']);
Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);

// Offices (with department/college hierarchy)
Route::get('/offices', [OfficeController::class, 'index']);
Route::post('/offices', [OfficeController::class, 'store']);
Route::get('/offices/{office}', [OfficeController::class, 'show']);
Route::put('/offices/{office}', [OfficeController::class, 'update']);
Route::delete('/offices/{office}', [OfficeController::class, 'destroy']);

// Borrow Requests (protected routes, require auth)
Route::middleware('auth:sanctum')->group(function () {
    // User endpoints
    Route::post('/borrow-requests', [BorrowRequestController::class, 'store']);
    Route::get('/borrow-requests/my', [BorrowRequestController::class, 'myRequests']);
    Route::get('/borrow-requests/item/{item}', [BorrowRequestController::class, 'itemHistory']);
    Route::get('/borrow-requests/location/{office}', [BorrowRequestController::class, 'locationHistory']);
    Route::get('/borrow-requests/{borrowRequest}', [BorrowRequestController::class, 'show']);

    // Admin endpoints
    Route::get('/borrow-requests/admin/pending', [BorrowRequestController::class, 'pending']);
    Route::patch('/borrow-requests/{borrowRequest}/approve', [BorrowRequestController::class, 'approve']);
    Route::patch('/borrow-requests/{borrowRequest}/reject', [BorrowRequestController::class, 'reject']);
    Route::patch('/borrow-requests/{borrowRequest}/mark-borrowed', [BorrowRequestController::class, 'markBorrowed']);
    Route::patch('/borrow-requests/{borrowRequest}/mark-returned', [BorrowRequestController::class, 'markReturned']);
});
