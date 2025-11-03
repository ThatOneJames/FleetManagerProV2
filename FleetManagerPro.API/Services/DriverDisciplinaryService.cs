using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace FleetManagerPro.API.Services
{
    public class DriverDisciplinaryService
    {
        private readonly FleetManagerDbContext _context;

        public DriverDisciplinaryService(FleetManagerDbContext context)
        {
            _context = context;
        }

        // Get warnings for a driver
        public async Task<List<DriverWarning>> GetWarningsByDriverAsync(string driverId)
        {
            return await _context.DriverWarnings
                .Where(w => w.DriverId == driverId)
                .OrderByDescending(w => w.DateIssued)
                .ToListAsync();
        }

        // Get suspensions for a driver
        public async Task<List<DriverSuspension>> GetSuspensionsByDriverAsync(string driverId)
        {
            return await _context.DriverSuspensionHistory
                .Where(s => s.DriverId == driverId)
                .OrderByDescending(s => s.DateSuspended)
                .ToListAsync();
        }

        // Adds a warning with category and auto-suspends if necessary
        public async Task<DriverWarning> AddWarningAsync(
            string driverId,
            string reason,
            string issuedBy,
            string? category = null)
        {
            var warning = new DriverWarning
            {
                Id = Guid.NewGuid().ToString(),
                DriverId = driverId,
                Reason = reason,
                Category = category,
                IssuedBy = issuedBy,
                DateIssued = GetPhilippinesTime()
            };
            _context.DriverWarnings.Add(warning);
            await _context.SaveChangesAsync();

            // Count warnings for this driver
            var warningCount = await _context.DriverWarnings.CountAsync(w => w.DriverId == driverId);

            // Auto-suspend after 5 warnings
            if (warningCount >= 5)
            {
                await AddSuspensionInternalAsync(driverId, "[AUTO] Received 5 or more warnings", "SYSTEM", true);
            }

            return warning;
        }

        // Adds a suspension and auto-archives if necessary
        public async Task<DriverSuspension> AddSuspensionAsync(string driverId, string reason, string issuedBy, bool auto = false)
        {
            return await AddSuspensionInternalAsync(driverId, reason, issuedBy, auto);
        }

        // Internal: Add suspension + auto-archive if needed
        private async Task<DriverSuspension> AddSuspensionInternalAsync(string driverId, string reason, string issuedBy, bool auto)
        {
            var suspension = new DriverSuspension
            {
                Id = Guid.NewGuid().ToString(),
                DriverId = driverId,
                Reason = reason,
                IssuedBy = issuedBy,
                DateSuspended = GetPhilippinesTime(),
                AutoSuspended = auto
            };
            _context.DriverSuspensionHistory.Add(suspension);

            // Set status to Suspended
            var user = await _context.Users.FindAsync(driverId);
            if (user != null && user.Status != "Archived")
            {
                user.Status = "Suspended";
                user.UpdatedAt = GetPhilippinesTime();
            }

            await _context.SaveChangesAsync();

            // Count suspensions
            var suspensionCount = await _context.DriverSuspensionHistory.CountAsync(s => s.DriverId == driverId);

            // Auto-archive after 3 suspensions
            if (suspensionCount >= 3 && user != null && user.Status != "Archived")
            {
                user.Status = "Archived";
                user.UpdatedAt = GetPhilippinesTime();
                await _context.SaveChangesAsync();
            }

            return suspension;
        }

        // Helper: Get current time in Philippines timezone
        private static DateTime GetPhilippinesTime()
        {
            try
            {
                // For Windows servers
                var tz = TimeZoneInfo.FindSystemTimeZoneById("Singapore Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            }
            catch
            {
                try
                {
                    // For Linux/Docker servers
                    var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Manila");
                    return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
                }
                catch
                {
                    // Fallback: manually add 8 hours to UTC
                    return DateTime.UtcNow.AddHours(8);
                }
            }
        }
    }
}
