using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/audit-logs")]
    [Authorize]
    public class AuditLogsController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;

        public AuditLogsController(FleetManagerDbContext context)
        {
            _context = context;
        }

        // GET: api/audit-logs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAuditLogs(
            [FromQuery] string? userId = null,
            [FromQuery] string? entityType = null,
            [FromQuery] string? actionType = null,
            [FromQuery] string? userRole = null, // ✅ NEW: Filter by role
            [FromQuery] int limit = 100,
            [FromQuery] int skip = 0)
        {
            try
            {
                var query = _context.AuditLogs
                    .Include(a => a.User)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(userId))
                    query = query.Where(a => a.UserId == userId);

                if (!string.IsNullOrEmpty(entityType))
                    query = query.Where(a => a.EntityType == entityType);

                if (!string.IsNullOrEmpty(actionType))
                    query = query.Where(a => a.ActionType == actionType);

                // ✅ NEW: Filter by role
                if (!string.IsNullOrEmpty(userRole))
                    query = query.Where(a => a.UserRole == userRole);

                var logs = await query
                    .OrderByDescending(a => a.Timestamp)
                    .Skip(skip)
                    .Take(limit)
                    .Select(a => new
                    {
                        a.Id,
                        a.UserId,
                        UserName = a.User != null ? a.User.Name : "Unknown User",
                        UserRole = a.UserRole ?? "N/A", // ✅ NEW: Include role
                        a.ActionType,
                        a.EntityType,
                        a.EntityId,
                        a.Description,
                        a.OldValue,
                        a.NewValue,
                        a.Status,
                        a.Timestamp
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve audit logs", error = ex.Message });
            }
        }

        // GET: api/audit-logs/count
        [HttpGet("count")]
        public async Task<ActionResult<object>> GetAuditLogsCount(
            [FromQuery] string? userId = null,
            [FromQuery] string? entityType = null,
            [FromQuery] string? actionType = null,
            [FromQuery] string? userRole = null) // ✅ NEW
        {
            try
            {
                var query = _context.AuditLogs.AsQueryable();

                if (!string.IsNullOrEmpty(userId))
                    query = query.Where(a => a.UserId == userId);

                if (!string.IsNullOrEmpty(entityType))
                    query = query.Where(a => a.EntityType == entityType);

                if (!string.IsNullOrEmpty(actionType))
                    query = query.Where(a => a.ActionType == actionType);

                // ✅ NEW: Filter by role
                if (!string.IsNullOrEmpty(userRole))
                    query = query.Where(a => a.UserRole == userRole);

                var count = await query.CountAsync();

                return Ok(new { count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to count audit logs", error = ex.Message });
            }
        }

        // GET: api/audit-logs/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserAuditLogs(
            string userId,
            [FromQuery] int limit = 100)
        {
            try
            {
                var logs = await _context.AuditLogs
                    .Include(a => a.User)
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.Timestamp)
                    .Take(limit)
                    .Select(a => new
                    {
                        a.Id,
                        a.UserId,
                        UserName = a.User != null ? a.User.Name : "Unknown User",
                        UserRole = a.UserRole ?? "N/A", // ✅ NEW
                        a.ActionType,
                        a.EntityType,
                        a.EntityId,
                        a.Description,
                        a.Status,
                        a.Timestamp
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve user audit logs", error = ex.Message });
            }
        }

        // GET: api/audit-logs/entity/{entityType}/{entityId}
        [HttpGet("entity/{entityType}/{entityId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetEntityAuditLogs(
            string entityType,
            string entityId)
        {
            try
            {
                var logs = await _context.AuditLogs
                    .Include(a => a.User)
                    .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                    .OrderBy(a => a.Timestamp)
                    .Select(a => new
                    {
                        a.Id,
                        a.UserId,
                        UserName = a.User != null ? a.User.Name : "Unknown User",
                        UserRole = a.UserRole ?? "N/A", // ✅ NEW
                        a.ActionType,
                        a.Description,
                        a.OldValue,
                        a.NewValue,
                        a.Status,
                        a.Timestamp
                    })
                    .ToListAsync();

                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve entity audit logs", error = ex.Message });
            }
        }

        // GET: api/audit-logs/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetAuditStatistics(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var query = _context.AuditLogs.AsQueryable();

                if (startDate.HasValue)
                    query = query.Where(a => a.Timestamp >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(a => a.Timestamp <= endDate.Value);

                var stats = new
                {
                    TotalActions = await query.CountAsync(),
                    TotalCreates = await query.CountAsync(a => a.ActionType == "CREATE"),
                    TotalUpdates = await query.CountAsync(a => a.ActionType == "UPDATE"),
                    TotalDeletes = await query.CountAsync(a => a.ActionType == "DELETE"),
                    TotalLogins = await query.CountAsync(a => a.ActionType == "LOGIN"),
                    SuccessRate = await query.CountAsync(a => a.Status == "SUCCESS") * 100.0 / Math.Max(await query.CountAsync(), 1),
                    // ✅ NEW: Stats by role
                    AdminActions = await query.CountAsync(a => a.UserRole == "Admin"),
                    DriverActions = await query.CountAsync(a => a.UserRole == "Driver"),
                    TopUsers = await query
                        .GroupBy(a => a.UserId)
                        .Select(g => new { UserId = g.Key, Count = g.Count() })
                        .OrderByDescending(x => x.Count)
                        .Take(5)
                        .ToListAsync()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve statistics", error = ex.Message });
            }
        }

        // POST: api/audit-logs
        [HttpPost]
        public async Task<ActionResult<AuditLog>> CreateAuditLog([FromBody] AuditLog auditLog)
        {
            try
            {
                auditLog.Id = Guid.NewGuid().ToString();
                auditLog.Timestamp = DateTime.UtcNow;

                // ✅ NEW: Auto-populate role if not provided
                if (string.IsNullOrEmpty(auditLog.UserRole) && !string.IsNullOrEmpty(auditLog.UserId))
                {
                    var user = await _context.Users.FindAsync(auditLog.UserId);
                    if (user != null)
                    {
                        auditLog.UserRole = user.Role;
                    }
                }

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAuditLogs), new { id = auditLog.Id }, auditLog);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create audit log", error = ex.Message });
            }
        }
    }
}
