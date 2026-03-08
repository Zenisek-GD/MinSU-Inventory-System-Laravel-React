<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ScannerSession;
use App\Models\ScannerScan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ScannerSessionController extends \App\Http\Controllers\Controller
{
    /**
     * Create a new scanner session (Desktop initiates)
     * Returns session code for mobile to join
     */
    public function createSession(Request $request): JsonResponse
    {
        try {
            // Generate unique session code
            $code = ScannerSession::generateCode();
            while (ScannerSession::where('session_code', $code)->exists()) {
                $code = ScannerSession::generateCode();
            }

            // Create session (30 minutes expiry)
            $session = ScannerSession::create([
                'session_code' => $code,
                'created_by_user_id' => $request->user()?->id ?? 0,
                'status' => 'active',
                'expires_at' => now()->addMinutes(30),
            ]);

            return response()->json([
                'success' => true,
                'session_id' => $session->id,
                'session_code' => $session->session_code,
                'expires_at' => $session->expires_at,
                'message' => 'Scanner session created. Share the code with your mobile device.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create session: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mobile joins session with code
     * No authentication required
     */
    public function joinSession(Request $request): JsonResponse
    {
        $request->validate([
            'session_code' => 'required|string|max:8',
        ]);

        try {
            $session = ScannerSession::where('session_code', $request->session_code)
                ->where('status', 'active')
                ->where('expires_at', '>', now())
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found or expired.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'session_id' => $session->id,
                'session_code' => $session->session_code,
                'message' => 'Joined scanner session successfully.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to join session: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mobile sends scanned QR code
     * No authentication required
     */
    public function submitScan(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|integer',
            'qr_code' => 'required|string',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $session = ScannerSession::find($request->session_id);

            if (!$session || !$session->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired session.'
                ], 404);
            }

            // Store the scan
            $scan = ScannerScan::create([
                'scanner_session_id' => $session->id,
                'qr_code' => $request->qr_code,
                'notes' => $request->notes,
                'processed' => false,
            ]);

            return response()->json([
                'success' => true,
                'scan_id' => $scan->id,
                'message' => 'QR code scanned and sent to desktop.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit scan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Desktop polls for new scans from mobile
     */
    public function getNewScans(Request $request, int $sessionId): JsonResponse
    {
        try {
            $session = ScannerSession::find($sessionId);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found.'
                ], 404);
            }

            // Get unprocessed scans
            $scans = $session->unprocessedScans()
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'session_id' => $session->id,
                'session_code' => $session->session_code,
                'scans' => $scans,
                'count' => $scans->count()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve scans: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Desktop marks scan as processed
     */
    public function markScanProcessed(Request $request, int $scanId): JsonResponse
    {
        try {
            $scan = ScannerScan::find($scanId);

            if (!$scan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Scan not found.'
                ], 404);
            }

            $scan->update(['processed' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Scan marked as processed.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark scan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session status (check if still active)
     */
    public function getSessionStatus(int $sessionId): JsonResponse
    {
        try {
            $session = ScannerSession::find($sessionId);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'session_id' => $session->id,
                'session_code' => $session->session_code,
                'status' => $session->status,
                'is_active' => $session->isActive(),
                'expires_at' => $session->expires_at,
                'expires_in_seconds' => max(0, $session->expires_at->diffInSeconds(now(), false))
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get session status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Close session (Desktop ends)
     */
    public function closeSession(Request $request, int $sessionId): JsonResponse
    {
        try {
            $session = ScannerSession::find($sessionId);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found.'
                ], 404);
            }

            $session->update(['status' => 'completed']);

            return response()->json([
                'success' => true,
                'message' => 'Scanner session closed.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to close session: ' . $e->getMessage()
            ], 500);
        }
    }
}
