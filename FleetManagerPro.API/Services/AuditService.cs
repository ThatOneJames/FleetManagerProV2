using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
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
            string status = "SUCCESS");
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
            string status = "SUCCESS")
        {
            try
            {
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    ActionType = actionType,
                    EntityType = entityType,
                    EntityId = entityId,
                    Description = description,
                    OldValue = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
                    NewValue = newValue != null ? JsonSerializer.Serialize(newValue) : null,
                    Status = status,
                    Timestamp = DateTime.UtcNow
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
