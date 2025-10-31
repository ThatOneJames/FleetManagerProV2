using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Services
{
    public interface IAuditService
    {
        Task LogActionAsync(
            string userId,
            string actionType,
            string entityType,
            string entityId,
            string description,
            object? oldValue = null,
            object? newValue = null,
            string status = "SUCCESS",
            string? affectedUserName = null);  // ✅ NEW: Who was affected
    }

    public class AuditService : IAuditService
    {
        private readonly FleetManagerDbContext _context;

        public AuditService(FleetManagerDbContext context)
        {
            _context = context;
        }

        public async Task LogActionAsync(
            string userId,
            string actionType,
            string entityType,
            string entityId,
            string description,
            object? oldValue = null,
            object? newValue = null,
            string status = "SUCCESS",
            string? affectedUserName = null)  // ✅ NEW: Who was affected
        {
            try
            {
                // ✅ Convert to Philippine Time (UTC+8)
                var philippineTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Singapore Standard Time");
                var philippineTime = TimeZoneInfo.ConvertTime(DateTime.UtcNow, philippineTimeZone);

                // ✅ NEW: Get affected user name if not provided
                if (string.IsNullOrEmpty(affectedUserName) && entityType == "User")
                {
                    var affectedUser = await _context.Users.FindAsync(entityId);
                    if (affectedUser != null)
                    {
                        affectedUserName = affectedUser.Name;
                    }
                }

                // ✅ NEW: Get affected driver name for DriverWarning/DriverSuspension
                if (string.IsNullOrEmpty(affectedUserName) &&
                    (entityType == "DriverWarning" || entityType == "DriverSuspension"))
                {
                    var driver = await _context.Users.FindAsync(entityId);
                    if (driver != null)
                    {
                        affectedUserName = driver.Name;
                    }
                }

                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    ActionType = actionType,
                    EntityType = entityType,
                    EntityId = entityId,
                    Description = $"{description}" +
                        (string.IsNullOrEmpty(affectedUserName) ? "" : $" | Affected: {affectedUserName}"),  // ✅ Show who was affected
                    OldValue = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
                    NewValue = newValue != null ? JsonSerializer.Serialize(newValue) : null,
                    Status = status,
                    Timestamp = philippineTime  // ✅ Now uses Philippine time
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUDIT] Error logging action: {ex.Message}");
                // Don't throw - audit failures shouldn't break main operations
            }
        }
    }
}
