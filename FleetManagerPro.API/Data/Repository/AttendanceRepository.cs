using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IAttendanceRepository
    {
        Task<IEnumerable<DriverAttendance>> GetAllAsync();
        Task<DriverAttendance?> GetByIdAsync(long id);
        Task<IEnumerable<DriverAttendance>> GetByDriverIdAsync(string driverId);
        Task<IEnumerable<DriverAttendance>> GetByDateRangeAsync(string driverId, DateTime startDate, DateTime endDate);
        Task<DriverAttendance?> GetByDriverAndDateAsync(string driverId, DateTime date);
        Task<DriverAttendance?> GetTodayAttendanceAsync(string driverId);
        Task<DriverAttendance> CreateAsync(DriverAttendance attendance);
        Task<bool> UpdateAsync(DriverAttendance attendance);
        Task<bool> DeleteAsync(long id);
        Task<bool> ClockInAsync(string driverId, DateTime clockInTime, string? location, string? notes);
        Task<bool> ClockOutAsync(string driverId, DateTime clockOutTime);
        Task<IEnumerable<DriverAttendance>> GetWeeklyAttendanceAsync(string driverId, DateTime weekStart);
        Task<Dictionary<string, object>> GetAttendanceStatsAsync(string driverId, DateTime startDate, DateTime endDate);
        Task<DriverAttendance?> GetLatestAttendanceAsync(string driverId);

    }

    public class AttendanceRepository : IAttendanceRepository
    {
        private readonly FleetManagerDbContext _context;

        public AttendanceRepository(FleetManagerDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DriverAttendance>> GetAllAsync()
        {
            return await _context.DriverAttendances
                .Include(a => a.Driver)
                .Include(a => a.Approver)
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        public async Task<DriverAttendance?> GetByIdAsync(long id)
        {
            return await _context.DriverAttendances
                .Include(a => a.Driver)
                .Include(a => a.Approver)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<IEnumerable<DriverAttendance>> GetByDriverIdAsync(string driverId)
        {
            return await _context.DriverAttendances
                .Include(a => a.Driver)
                .Include(a => a.Approver)
                .Where(a => a.DriverId == driverId)
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<DriverAttendance>> GetByDateRangeAsync(string driverId, DateTime startDate, DateTime endDate)
        {
            return await _context.DriverAttendances
                .Include(a => a.Driver)
                .Include(a => a.Approver)
                .Where(a => a.DriverId == driverId &&
                           a.Date.Date >= startDate.Date &&
                           a.Date.Date <= endDate.Date)
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        public async Task<DriverAttendance?> GetByDriverAndDateAsync(string driverId, DateTime date)
        {
            return await _context.DriverAttendances
                .Include(a => a.Driver)
                .Include(a => a.Approver)
                .FirstOrDefaultAsync(a => a.DriverId == driverId && a.Date.Date == date.Date);
        }

        public async Task<DriverAttendance?> GetTodayAttendanceAsync(string driverId)
        {
            var today = DateTime.Today;
            return await GetByDriverAndDateAsync(driverId, today);
        }

        public async Task<DriverAttendance> CreateAsync(DriverAttendance attendance)
        {
            attendance.CreatedAt = DateTime.UtcNow;
            attendance.UpdatedAt = DateTime.UtcNow;

            _context.DriverAttendances.Add(attendance);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            var created = await GetByIdAsync(attendance.Id);
            return created ?? attendance;
        }

        public async Task<bool> UpdateAsync(DriverAttendance attendance)
        {
            try
            {
                attendance.UpdatedAt = DateTime.UtcNow;
                _context.DriverAttendances.Update(attendance);
                return await _context.SaveChangesAsync() > 0;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var attendance = await _context.DriverAttendances.FindAsync(id);
            if (attendance == null) return false;

            _context.DriverAttendances.Remove(attendance);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> ClockInAsync(string driverId, DateTime clockInTime, string? location, string? notes)
        {
            try
            {
                var today = clockInTime.Date;
                var existingRecord = await GetByDriverAndDateAsync(driverId, today);

                if (existingRecord != null)
                {
                    // Update existing record
                    existingRecord.ClockIn = clockInTime.TimeOfDay;
                    existingRecord.Location = location;
                    existingRecord.Notes = notes;
                    existingRecord.Status = "Present";
                    return await UpdateAsync(existingRecord);
                }
                else
                {
                    // Create new record
                    var newRecord = new DriverAttendance
                    {
                        DriverId = driverId,
                        Date = today,
                        ClockIn = clockInTime.TimeOfDay,
                        Location = location,
                        Notes = notes,
                        Status = "Present"
                    };
                    await CreateAsync(newRecord);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> ClockOutAsync(string driverId, DateTime clockOutTime)
        {
            try
            {
                var today = clockOutTime.Date;
                var record = await GetByDriverAndDateAsync(driverId, today);

                if (record == null || record.ClockIn == null)
                    return false;

                record.ClockOut = clockOutTime.TimeOfDay;

                // Calculate total hours
                var clockInDateTime = today.Add(record.ClockIn.Value);
                var clockOutDateTime = today.Add(record.ClockOut.Value);
                var totalMinutes = (clockOutDateTime - clockInDateTime).TotalMinutes;

                // Subtract break duration
                totalMinutes -= (double)(record.BreakDuration * 60);
                record.TotalHours = (decimal)(totalMinutes / 60);

                // Calculate overtime (assuming 8 hours is standard)
                if (record.TotalHours > 8)
                {
                    record.OvertimeHours = record.TotalHours.Value - 8;
                }

                return await UpdateAsync(record);
            }
            catch
            {
                return false;
            }
        }

        public async Task<IEnumerable<DriverAttendance>> GetWeeklyAttendanceAsync(string driverId, DateTime weekStart)
        {
            var weekEnd = weekStart.AddDays(6);
            return await GetByDateRangeAsync(driverId, weekStart, weekEnd);
        }

        public async Task<Dictionary<string, object>> GetAttendanceStatsAsync(string driverId, DateTime startDate, DateTime endDate)
        {
            var records = await GetByDateRangeAsync(driverId, startDate, endDate);

            var totalDays = (endDate - startDate).Days + 1;
            var presentRecords = records.Where(r => r.Status == "Present" || r.Status == "Late").ToList();
            var absentRecords = records.Where(r => r.Status == "Absent").ToList();
            var lateRecords = records.Where(r => r.Status == "Late").ToList();

            var totalHours = presentRecords.Sum(r => r.TotalHours ?? 0);
            var overtimeHours = presentRecords.Sum(r => r.OvertimeHours);

            // Calculate average clock in time
            var clockInTimes = presentRecords
                .Where(r => r.ClockIn.HasValue)
                .Select(r => r.ClockIn.Value)
                .ToList();

            var averageClockIn = "N/A";
            if (clockInTimes.Any())
            {
                var averageTicks = (long)clockInTimes.Average(t => t.Ticks);
                var averageTime = new TimeSpan(averageTicks);
                averageClockIn = averageTime.ToString(@"hh\:mm");
            }

            return new Dictionary<string, object>
            {
                ["TotalHours"] = totalHours,
                ["DaysPresent"] = presentRecords.Count,
                ["DaysAbsent"] = absentRecords.Count,
                ["DaysLate"] = lateRecords.Count,
                ["AverageClockIn"] = averageClockIn,
                ["OvertimeHours"] = overtimeHours,
                ["AttendancePercentage"] = totalDays > 0 ? Math.Round((decimal)presentRecords.Count / totalDays * 100, 2) : 0
            };
        }
        public async Task<DriverAttendance?> GetLatestAttendanceAsync(string driverId)
        {
            return await _context.DriverAttendances
                .Include(a => a.Driver)
                .Include(a => a.Approver)
                .Where(a => a.DriverId == driverId && a.ClockIn != null)
                .OrderByDescending(a => a.Date)
                .ThenByDescending(a => a.ClockIn)
                .FirstOrDefaultAsync();
        }

    }
}