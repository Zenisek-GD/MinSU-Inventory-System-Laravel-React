<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        /**
         * Daily database backup at 2 AM
         * This will create a backup of the entire database and store it in storage/backups/
         */
        $schedule->command('backup:run --only-db')
            ->dailyAt('02:00')
            ->name('daily-database-backup')
            ->description('Daily database backup at 2 AM');

        /**
         * Weekly full backup (files + database) every Sunday at 3 AM
         * Includes both database and application files
         */
        $schedule->command('backup:run')
            ->weeklyOn(0, '03:00')
            ->name('weekly-full-backup')
            ->description('Weekly full backup (database + files) every Sunday at 3 AM');

        /**
         * Cleanup old backups daily at 4 AM
         * Removes backups older than 7 days or when storage exceeds 5GB
         */
        $schedule->command('backup:clean')
            ->dailyAt('04:00')
            ->name('backup-cleanup')
            ->description('Cleanup old backups - keeps last 7 days or 5GB whichever is smaller');

        /**
         * Monitor backup health daily at 5 AM
         * Checks if recent backups exist and are healthy
         */
        $schedule->command('backup:monitor')
            ->dailyAt('05:00')
            ->name('backup-monitor')
            ->description('Monitor backup health');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
