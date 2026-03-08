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
     */
    public static function notifyMRCreated(MemorandumReceipt $mr, User $creator): void
    {
        // Get all supply officers and admins
        $recipients = User::whereIn('role', ['supply_officer', 'admin'])->get();

        foreach ($recipients as $recipient) {
            self::create([
                'user_id' => $recipient->id,
                'type' => 'mr_created',
                'title' => 'New Memorandum Receipt',
                'message' => "{$creator->name} created a new MR: {$mr->mr_number}",
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
}
