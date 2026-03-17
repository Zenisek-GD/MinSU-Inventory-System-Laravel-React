<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'related_model',
        'related_id',
        'action_link',
        'color',
        'read_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    /**
     * Get the user that owns the notification
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Check if notification is unread
     */
    public function isUnread(): bool
    {
        return is_null($this->read_at);
    }

    /**
     * Create notification for MR creation
     * Notifies:
     * - The accountable officer (end user) that an MR has been created for them
     * - All supply officers and admins for oversight
     */
    public static function notifyMRCreated(MemorandumReceipt $mr, User $creator): void
    {
        // Notify the accountable officer (end user) - they are the recipient of the MR
        $accountableOfficer = User::where('name', $mr->accountable_officer)->first();
        if ($accountableOfficer && $accountableOfficer->id !== $creator->id) {
            self::create([
                'user_id' => $accountableOfficer->id,
                'type' => 'mr_created',
                'title' => 'New Memorandum Receipt Created For You',
                'message' => "A new MR {$mr->mr_number} has been created. Status: {$mr->status}",
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'info',
            ]);
        }

        // Also notify all supply officers and admins
        $recipients = User::whereIn('role', ['supply_officer', 'admin'])->get();
        foreach ($recipients as $recipient) {
            self::create([
                'user_id' => $recipient->id,
                'type' => 'mr_created',
                'title' => 'New Memorandum Receipt',
                'message' => "{$creator->name} created MR {$mr->mr_number} for {$mr->accountable_officer}",
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'info',
            ]);
        }
    }

    /**
     * Create notification for MR approval
     */
    public static function notifyMRApproved(MemorandumReceipt $mr, User $approver): void
    {
        // Notify the creator
        if ($mr->created_by) {
            self::create([
                'user_id' => $mr->created_by,
                'type' => 'mr_approved',
                'title' => 'Memorandum Receipt Approved',
                'message' => "{$approver->name} approved MR: {$mr->mr_number}",
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'success',
            ]);
        }

        // Also notify all admins
        $admins = User::where('role', 'admin')->whereNot('id', $approver->id)->get();
        foreach ($admins as $admin) {
            self::create([
                'user_id' => $admin->id,
                'type' => 'mr_approved',
                'title' => 'Memorandum Receipt Approved',
                'message' => "{$approver->name} approved MR: {$mr->mr_number}",
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'success',
            ]);
        }
    }

    /**
     * Create notification for MR rejection
     */
    public static function notifyMRRejected(MemorandumReceipt $mr, User $rejecter, string $reason = ''): void
    {
        // Notify the creator
        if ($mr->created_by) {
            self::create([
                'user_id' => $mr->created_by,
                'type' => 'mr_rejected',
                'title' => 'Memorandum Receipt Rejected',
                'message' => "{$rejecter->name} rejected MR: {$mr->mr_number}" . ($reason ? " - {$reason}" : ''),
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'error',
            ]);
        }

        // Also notify all admins
        $admins = User::where('role', 'admin')->whereNot('id', $rejecter->id)->get();
        foreach ($admins as $admin) {
            self::create([
                'user_id' => $admin->id,
                'type' => 'mr_rejected',
                'title' => 'Memorandum Receipt Rejected',
                'message' => "{$rejecter->name} rejected MR: {$mr->mr_number}",
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'error',
            ]);
        }
    }

    /**
     * Get unread notifications for a user
     */
    public static function getUnreadForUser(int $userId)
    {
        return self::where('user_id', $userId)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all notifications for a user with optional limit
     */
    public static function getForUser(int $userId, int $limit = 20)
    {
        return self::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Create notification for MR ready for receiving (status change)
     */
    public static function notifyMRReadyForReceiving(MemorandumReceipt $mr): void
    {
        // Notify the accountable officer (end user) that items are ready to be received
        $accountableOfficer = User::where('name', $mr->accountable_officer)->first();
        if ($accountableOfficer) {
            self::create([
                'user_id' => $accountableOfficer->id,
                'type' => 'mr_ready_for_receiving',
                'title' => 'Your Items Are Ready to Receive',
                'message' => "MR {$mr->mr_number} is ready for you to sign and receive. Please review and accept the items.",
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'warning',
            ]);
        }
    }

    /**
     * Create notification for MR received by accountable officer
     */
    public static function notifyMRReceived(MemorandumReceipt $mr, User $receiver): void
    {
        // Notify supply officers and admins that items were received
        $recipients = User::whereIn('role', ['supply_officer', 'admin'])->get();

        foreach ($recipients as $recipient) {
            self::create([
                'user_id' => $recipient->id,
                'type' => 'mr_received',
                'title' => 'Memorandum Receipt Received',
                'message' => "{$receiver->name} received and signed for MR: {$mr->mr_number}. Items are now in their custody.",
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'primary',
            ]);
        }
    }

    /**
     * Create notification for MR returned to inventory
     */
    public static function notifyMRReturned(MemorandumReceipt $mr, User $returner, string $itemsInfo = ''): void
    {
        // Notify the end user that return was completed
        self::create([
            'user_id' => $returner->id,
            'type' => 'mr_return_completed',
            'title' => 'Items Return Completed',
            'message' => "MR {$mr->mr_number} return has been processed and recorded. Thank you.",
            'related_model' => 'MemorandumReceipt',
            'related_id' => $mr->id,
            'action_link' => "/memorandum-receipts/{$mr->id}",
            'color' => 'success',
        ]);

        // Notify supply officers and admins
        $recipients = User::whereIn('role', ['supply_officer', 'admin'])->get();
        foreach ($recipients as $recipient) {
            self::create([
                'user_id' => $recipient->id,
                'type' => 'mr_returned',
                'title' => 'Memorandum Receipt Returned',
                'message' => "{$returner->name} returned MR: {$mr->mr_number}. Items checked and back in inventory." . ($itemsInfo ? " {$itemsInfo}" : ''),
                'related_model' => 'MemorandumReceipt',
                'related_id' => $mr->id,
                'action_link' => "/memorandum-receipts/{$mr->id}",
                'color' => 'success',
            ]);
        }
    }
}
