/**
 * Auto Clock-Out Job
 * Runs at 11:59 PM daily via cron.
 * Finds any employees who clocked in but never clocked out, and automatically
 * clocks them out, marking the record as Half-Day if < 4 hours worked.
 */
import cron from 'node-cron';
import { Attendance, AttendanceStatus } from '../models/Attendance';

export function startAutoClockOutJob() {
  // Runs at 23:59 every day
  cron.schedule('59 23 * * *', async () => {
    console.log('[AutoClockOut] Running auto clock-out job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all records today where clockIn exists but clockOut is missing
      const openRecords = await Attendance.find({
        date: today,
        clockIn: { $exists: true },
        clockOut: { $exists: false },
        status: { $nin: [AttendanceStatus.ON_LEAVE, AttendanceStatus.ABSENT] },
      });

      if (openRecords.length === 0) {
        console.log('[AutoClockOut] No open clock-ins found.');
        return;
      }

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 0, 0);

      const updates = openRecords.map((record) => {
        const totalMs = endOfDay.getTime() - record.clockIn!.getTime();
        const totalHours = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;

        record.clockOut = endOfDay;
        record.totalHours = totalHours;
        record.notes = (record.notes ? record.notes + ' | ' : '') + 'Auto clocked-out at 23:59';

        if (totalHours < 4) {
          record.status = AttendanceStatus.HALF_DAY;
        }

        return record.save();
      });

      await Promise.all(updates);
      console.log(`[AutoClockOut] Auto clocked-out ${openRecords.length} employee(s).`);
    } catch (err) {
      console.error('[AutoClockOut] Error during auto clock-out:', err);
    }
  });

  console.log('[AutoClockOut] Auto clock-out cron job scheduled for 23:59 daily.');
}
