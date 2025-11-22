<?php

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\OfficeController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ItemController;
use App\Http\Controllers\Api\V1\PurchaseRequestController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/users/role-counts', [AuthController::class, 'roleCounts']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/profile', [AuthController::class, 'profile']);

        // Office resource routes
        Route::apiResource('offices', OfficeController::class);
        // Category resource routes
        Route::apiResource('categories', CategoryController::class);
        // User resource routes
        Route::apiResource('users', \App\Http\Controllers\Api\V1\UserController::class);
        // Item resource routes
        Route::apiResource('items', ItemController::class);
        // PurchaseRequest resource routes
        Route::apiResource('purchase-requests', PurchaseRequestController::class);
        // Custom approve/reject routes for purchase requests
        Route::put('purchase-requests/{purchaseRequestRecord}/approve', [PurchaseRequestController::class, 'approve']);
        Route::put('purchase-requests/{purchaseRequestRecord}/reject', [PurchaseRequestController::class, 'reject']);
        // Borrow resource routes
        Route::apiResource('borrows', \App\Http\Controllers\Api\V1\BorrowController::class);
        // Custom approve/reject routes for borrows
        Route::put('borrows/{borrowRecord}/approve', [\App\Http\Controllers\Api\V1\BorrowController::class, 'approve']);
        Route::put('borrows/{borrowRecord}/reject', [\App\Http\Controllers\Api\V1\BorrowController::class, 'reject']);
    });
});