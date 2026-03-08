<?php

return [
    /*
     * The backup driver to be used to create backups.
     */
    'default' => env('BACKUP_DRIVER', 'local'),

    'backup' => [
        /*
         * The name of this application. You can use this variable
         * in the backup name and filename.
         */
        'name' => env('APP_NAME', 'minsu_backup'),

        'source' => [

            'files' => [

                /*
                 * The list of directories and files that will be included in the backup.
                 */
                'include' => [
                    base_path(),
                ],

                /*
                 * These directories and files will be excluded from the backup.
                 *
                 * Directories used by laravel or other packages:
                 *
                 * - vendor
                 * - node_modules
                 * - .git
                 * - .github
                 * - bootstrap/cache
                 * - storage/cache
                 * - storage/logs
                 */
                'exclude' => [
                    base_path('vendor'),
                    base_path('node_modules'),
                    base_path('.git'),
                    base_path('.github'),
                    base_path('bootstrap/cache'),
                    base_path('storage/cache'),
                    base_path('storage/logs'),
                    base_path('.env.backup'),
                    base_path('public/storage'),
                ],

                /*
                 * Determines if symlinks should be followed.
                 */
                'follow_links' => false,

                /*
                 * Determines if unreadable directories should be ignored.
                 */
                'ignore_unreadable_directories' => false,

                /*
                 * This path is relative to the given 'include' directories
                 * and determines where to cut the backup.
                 */
                'relative_path' => base_path(),
            ],

            'databases' => [
                'mysql',
            ],
        ],

        'destination' => [

            /*
             * The filename prefix used for the backup files.
             */
            'filename_prefix' => '',

            /*
             * The disk on which the backups will be stored.
             */
            'disk' => 'backups',
        ],

        /*
         * The directory where the temporary files will be stored.
         */
        'temporary_directory' => storage_path('backups/temp'),

        /*
         * The password to be used for archive encryption.
         * Set to null to disable encryption.
         */
        'password' => env('BACKUP_ENCRYPTION_PASSWORD'),

        /*
         * The encryption algorithm to be used.
         */
        'encryption' => 'default',

        /*
         * The compression algorithm to be used.
         */
        'compression_method' => 'gzip',
    ],

    /*
     * You can specify different disks where the backups will be stored.
     */
    'disks' => [
        'backups' => [
            'driver' => 'local',
            'root' => storage_path('backups'),
            'url' => env('APP_URL') . '/storage/backups',
            'visibility' => 'private',
        ],
    ],

    'cleanup' => [

        /*
         * The strategy that will be used to cleanup old backups.
         * The youngest backup wil never be deleted.
         */
        'strategy' => \Spatie\Backup\Tasks\Cleanup\Strategies\DefaultStrategy::class,

        'defaults' => [

            /*
             * The number of days that backups must be kept.
             */
            'keep_all_backups_for_days' => 7,

            /*
             * The number of days that we want to keep daily backups
             */
            'keep_daily_backups_for_days' => 16,

            /*
             * The number of weeks that we want to keep weekly backups.
             */
            'keep_weekly_backups_for_weeks' => 8,

            /*
             * The number of months that we want to keep monthly backups.
             */
            'keep_monthly_backups_for_months' => 4,

            /*
             * The number of years that we want to keep yearly backups.
             */
            'keep_yearly_backups_for_years' => 2,

            /*
             * The maximum number of backups that may be stored.
             */
            'keep_at_least_backups' => 2,
        ],

        'delete_oldest_backups_when_cleanup_starts' => false,

        /*
         * If not set to null, clean up the oldest backup until
         * this amount of megabytes has been deleted.
         */
        'delete_oldest_backups_until_using_mb' => 5000,
    ],

    'notifications' => [

        'notifications' => [
            //\Spatie\Backup\Notifications\Notifications\BackupHasFailedNotification::class,
            //\Spatie\Backup\Notifications\Notifications\UnhealthyBackupWasFoundNotification::class,
            //\Spatie\Backup\Notifications\Notifications\CleanupHasFailedNotification::class,
            //\Spatie\Backup\Notifications\Notifications\BackupWasSuccessfulNotification::class,
        ],

        'notifiable' => \Spatie\Backup\Notifications\Notifiable::class,

        'mail' => [
            'to' => env('BACKUP_MAIL_TO', 'admin@minsu.local'),
        ],
    ],

    'monitorable' => [
        \Spatie\Backup\Tasks\Monitor\HealthChecks\MaximumAgeInDays::class => 1,
        \Spatie\Backup\Tasks\Monitor\HealthChecks\MaximumStorageInMegabytes::class => 5000,
    ],
];
