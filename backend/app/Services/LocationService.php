<?php

namespace App\Services;

class LocationService
{
    /**
     * Normalize a user-entered token for use in room_id.
     */
    public static function normalizeToken(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);
        if ($value === '') {
            return null;
        }

        // Uppercase and replace whitespace with underscores.
        $value = preg_replace('/\s+/', '_', $value);
        return strtoupper($value);
    }

    /**
     * Normalize floor input into the canonical form like "2F".
     */
    public static function normalizeFloor(?string $floor): ?string
    {
        $floor = self::normalizeToken($floor);
        if ($floor === null) {
            return null;
        }

        // Accept "2" => "2F"
        if (preg_match('/^[0-9]+$/', $floor)) {
            return $floor . 'F';
        }

        // Accept "2F" or "2f"
        if (preg_match('/^[0-9]+F$/', $floor)) {
            return $floor;
        }

        return $floor;
    }

    public static function normalizeRoomId(?string $roomId): ?string
    {
        $roomId = self::normalizeToken($roomId);
        if ($roomId === null) {
            return null;
        }

        // Keep dashes as-is, normalize repeated dashes.
        $roomId = preg_replace('/-+/', '-', $roomId);
        return $roomId;
    }

    /**
     * Generate an academic room_id: [BUILDING]-[FLOOR]-[ROOM]
     * Example: CBM-2F-R01, IT-3F-LAB02
     */
    public static function generateAcademicRoomId(?string $building, ?string $floor, ?string $roomCode): ?string
    {
        $building = self::normalizeToken($building);
        $floor = self::normalizeFloor($floor);
        $roomCode = self::normalizeToken($roomCode);

        if (!$building || !$floor || !$roomCode) {
            return null;
        }

        return $building . '-' . $floor . '-' . $roomCode;
    }

    /**
     * Generate a non-academic office room_id: [OFFICE]-OFFICE
     * Example: REG-OFFICE, OSAS-OFFICE
     */
    public static function generateOfficeRoomId(?string $officeCode): ?string
    {
        $officeCode = self::normalizeToken($officeCode);
        if (!$officeCode) {
            return null;
        }

        return $officeCode . '-OFFICE';
    }

    /**
     * Infer room_id from building/floor/room_number if room_id is missing.
     */
    public static function inferRoomId(array $data): ?string
    {
        if (!empty($data['room_id'])) {
            return self::normalizeRoomId($data['room_id']);
        }

        if (!empty($data['building']) && !empty($data['floor']) && !empty($data['room_number'])) {
            return self::generateAcademicRoomId($data['building'], $data['floor'], $data['room_number']);
        }

        return null;
    }

    /**
     * Validate room_id shape according to system rules.
     */
    public static function isValidRoomId(?string $roomId): bool
    {
        $roomId = self::normalizeRoomId($roomId);
        if ($roomId === null) {
            return true; // nullable
        }

        return (bool) preg_match('/^(?:[A-Z0-9_]+-OFFICE|[A-Z0-9_]+-[0-9]+F-[A-Z0-9]+)$/', $roomId);
    }
}
