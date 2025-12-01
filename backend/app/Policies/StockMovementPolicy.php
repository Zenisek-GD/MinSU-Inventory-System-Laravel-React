<?php

namespace App\Policies;

use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class StockMovementPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any stock movements.
     */
    public function viewAny(User $user)
    {
        return in_array($user->role, ['admin', 'supply_officer']);
    }

    /**
     * Determine whether the user can view a specific stock movement.
     */
    public function view(User $user, StockMovement $movement)
    {
        if (in_array($user->role, ['admin', 'supply_officer'])) {
            return true;
        }
        // Allow users to view movements they performed
        return $movement->performed_by === $user->id;
    }

    /**
     * Determine whether the user can create stock movements.
     */
    public function create(User $user)
    {
        return in_array($user->role, ['admin', 'supply_officer']);
    }

    /**
     * Determine whether the user can delete a stock movement.
     */
    public function delete(User $user, StockMovement $movement)
    {
        // only admins can delete movement records
        return $user->role === 'admin';
    }
}
