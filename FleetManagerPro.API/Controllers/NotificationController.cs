using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FleetManagerPro.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly FleetManagerDbContext _context;

        public NotificationsController(INotificationService notificationService, FleetManagerDbContext context)
        {
            _notificationService = notificationService;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            try
            {
                var query = _context.Notifications.Where(n => n.UserId == userId).OrderByDescending(n => n.CreatedAt);
                var notifications = unreadOnly ? await query.Where(n => !n.IsRead).ToListAsync() : await query.Take(100).ToListAsync();
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving notifications", error = ex.Message });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllNotifications()
        {
            try
            {
                var notifications = await _context.Notifications
                    .Include(n => n.User)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(100)
                    .ToListAsync();
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving notifications", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNotification([FromBody] Notification notification)
        {
            try
            {
                notification.CreatedAt = DateTime.UtcNow;
                notification.IsRead = false;
                notification.IsSent = false;
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                await _notificationService.SendNotificationAsync(notification.UserId ?? "", notification.Message);
                return Ok(notification);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating notification", error = ex.Message });
            }
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(long id)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            try
            {
                var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
                if (notification == null) return NotFound(new { message = "Notification not found" });
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error marking notification as read", error = ex.Message });
            }
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            try
            {
                var notifications = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
                return Ok(new { message = "All notifications marked as read" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error marking notifications as read", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(long id)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            try
            {
                var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
                if (notification == null) return NotFound(new { message = "Notification not found" });
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Notification deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting notification", error = ex.Message });
            }
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class NotificationRulesController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;

        public NotificationRulesController(FleetManagerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRules()
        {
            try
            {
                var rules = await _context.NotificationRules.ToListAsync();
                return Ok(rules);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving rules", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateRule([FromBody] NotificationRule rule)
        {
            try
            {
                rule.Id = Guid.NewGuid().ToString();
                rule.CreatedAt = DateTime.UtcNow;
                _context.NotificationRules.Add(rule);
                await _context.SaveChangesAsync();
                return Ok(rule);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating rule", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRule(string id, [FromBody] NotificationRule updatedRule)
        {
            try
            {
                var rule = await _context.NotificationRules.FindAsync(id);
                if (rule == null) return NotFound(new { message = "Rule not found" });
                rule.Name = updatedRule.Name;
                rule.TriggerType = updatedRule.TriggerType;
                rule.ConditionText = updatedRule.ConditionText;
                rule.Recipients = updatedRule.Recipients;
                rule.SendEmail = updatedRule.SendEmail;
                rule.SendSms = updatedRule.SendSms;
                rule.IsActive = updatedRule.IsActive;
                rule.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(rule);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating rule", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRule(string id)
        {
            try
            {
                var rule = await _context.NotificationRules.FindAsync(id);
                if (rule == null) return NotFound(new { message = "Rule not found" });
                _context.NotificationRules.Remove(rule);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Rule deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting rule", error = ex.Message });
            }
        }
    }
}
