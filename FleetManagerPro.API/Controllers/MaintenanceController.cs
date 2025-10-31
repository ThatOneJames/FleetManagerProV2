using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.DTOs;
using FleetManagerPro.API.Services;
using System.Security.Claims;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;
        private readonly IAuditService _auditService;
        private readonly ILogger<MaintenanceController> _logger;

        public MaintenanceController(
            FleetManagerDbContext context,
            IAuditService auditService,
            ILogger<MaintenanceController> logger)
        {
            _context = context;
            _auditService = auditService;
            _logger = logger;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

        // GET: api/maintenance/tasks
        [HttpGet("tasks")]
        public async Task<ActionResult<IEnumerable<MaintenanceTaskDto>>> GetAllTasks(
            [FromQuery] string? vehicleId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? priority = null)
        {
            try
            {
                var query = _context.Set<MaintenanceTask>()
                    .Include(t => t.Vehicle)
                    .Include(t => t.Category)
                    .AsNoTracking()
                    .AsQueryable();

                if (!string.IsNullOrEmpty(vehicleId))
                    query = query.Where(t => t.VehicleId == vehicleId);

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(t => t.Status == status);

                if (!string.IsNullOrEmpty(priority))
                    query = query.Where(t => t.Priority == priority);

                var tasks = await query.OrderByDescending(t => t.ScheduledDate).ToListAsync();

                return Ok(tasks.Select(t => MapToDto(t)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving maintenance tasks");
                return StatusCode(500, new { message = "Error retrieving maintenance tasks" });
            }
        }

        // GET: api/maintenance/tasks/{id}
        [HttpGet("tasks/{id}")]
        public async Task<ActionResult<MaintenanceTaskDto>> GetTask(string id)
        {
            try
            {
                var task = await _context.Set<MaintenanceTask>()
                    .Include(t => t.Vehicle)
                    .Include(t => t.Category)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                    return NotFound(new { message = "Maintenance task not found" });

                return MapToDto(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving maintenance task {Id}", id);
                return StatusCode(500, new { message = "Error retrieving maintenance task" });
            }
        }

        // POST: api/maintenance/tasks
        [HttpPost("tasks")]
        public async Task<ActionResult<MaintenanceTaskDto>> CreateTask(CreateMaintenanceTaskDto dto)
        {
            try
            {
                var task = new MaintenanceTask
                {
                    Id = Guid.NewGuid().ToString(),
                    VehicleId = dto.VehicleId,
                    CategoryId = dto.CategoryId,
                    TaskType = dto.TaskType,
                    Description = dto.Description,
                    Priority = dto.Priority,
                    Status = dto.Status,
                    ScheduledDate = dto.ScheduledDate,
                    ScheduledMileage = dto.ScheduledMileage,
                    EstimatedCost = dto.EstimatedCost,
                    AssignedTo = dto.AssignedTo,
                    ServiceProvider = dto.ServiceProvider,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Set<MaintenanceTask>().Add(task);
                await _context.SaveChangesAsync();

                // ✅ AUDIT LOG - CREATE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "CREATE",
                    "MaintenanceTask",
                    task.Id,
                    $"Created maintenance task: {dto.TaskType} for {dto.VehicleId}",
                    null,
                    new { task.TaskType, task.Priority, task.Status, task.ScheduledDate, dto.EstimatedCost }
                );

                // Reload with navigation properties
                var createdTask = await _context.Set<MaintenanceTask>()
                    .Include(t => t.Vehicle)
                    .Include(t => t.Category)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == task.Id);

                return CreatedAtAction(nameof(GetTask), new { id = task.Id }, MapToDto(createdTask!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating maintenance task");
                return StatusCode(500, new { message = "Error creating maintenance task" });
            }
        }

        // PUT: api/maintenance/tasks/{id}
        [HttpPut("tasks/{id}")]
        public async Task<IActionResult> UpdateTask(string id, UpdateMaintenanceTaskDto dto)
        {
            try
            {
                var existing = await _context.Set<MaintenanceTask>().FindAsync(id);
                if (existing == null)
                    return NotFound(new { message = "Maintenance task not found" });

                // Capture old values for audit
                var oldValue = new
                {
                    existing.Status,
                    existing.Priority,
                    existing.ScheduledDate,
                    existing.CompletedDate,
                    existing.ActualCost,
                    existing.TechnicianNotes
                };

                existing.VehicleId = dto.VehicleId;
                existing.CategoryId = dto.CategoryId;
                existing.TaskType = dto.TaskType;
                existing.Description = dto.Description;
                existing.Priority = dto.Priority;
                existing.Status = dto.Status;
                existing.ScheduledDate = dto.ScheduledDate;
                existing.CompletedDate = dto.CompletedDate;
                existing.ScheduledMileage = dto.ScheduledMileage;
                existing.CompletedMileage = dto.CompletedMileage;
                existing.EstimatedCost = dto.EstimatedCost;
                existing.ActualCost = dto.ActualCost;
                existing.AssignedTo = dto.AssignedTo;
                existing.TechnicianNotes = dto.TechnicianNotes;
                existing.PartsUsed = dto.PartsUsed;
                existing.LaborHours = dto.LaborHours;
                existing.ServiceProvider = dto.ServiceProvider;
                existing.WarrantyUntil = dto.WarrantyUntil;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // ✅ AUDIT LOG - UPDATE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "UPDATE",
                    "MaintenanceTask",
                    id,
                    $"Updated maintenance task - Status: {oldValue.Status} → {dto.Status}, Cost: ${oldValue.ActualCost} → ${dto.ActualCost}",
                    oldValue,
                    new { existing.Status, existing.Priority, existing.CompletedDate, existing.ActualCost }
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating maintenance task {Id}", id);
                return StatusCode(500, new { message = "Error updating maintenance task" });
            }
        }

        // DELETE: api/maintenance/tasks/{id}
        [HttpDelete("tasks/{id}")]
        public async Task<IActionResult> DeleteTask(string id)
        {
            try
            {
                var task = await _context.Set<MaintenanceTask>().FindAsync(id);
                if (task == null)
                    return NotFound(new { message = "Maintenance task not found" });

                _context.Set<MaintenanceTask>().Remove(task);
                await _context.SaveChangesAsync();

                // ✅ AUDIT LOG - DELETE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "DELETE",
                    "MaintenanceTask",
                    id,
                    $"Deleted maintenance task: {task.TaskType}",
                    new { task.TaskType, task.Status, task.Priority },
                    null
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting maintenance task {Id}", id);
                return StatusCode(500, new { message = "Error deleting maintenance task" });
            }
        }

        // GET: api/maintenance/overdue
        [HttpGet("overdue")]
        public async Task<ActionResult<IEnumerable<MaintenanceTaskDto>>> GetOverdueTasks()
        {
            try
            {
                var overdueTasks = await _context.Set<MaintenanceTask>()
                    .Include(t => t.Vehicle)
                    .Include(t => t.Category)
                    .AsNoTracking()
                    .Where(t => t.Status != "Completed" &&
                               t.Status != "Cancelled" &&
                               t.ScheduledDate < DateTime.UtcNow)
                    .OrderBy(t => t.ScheduledDate)
                    .ToListAsync();

                return Ok(overdueTasks.Select(t => MapToDto(t)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overdue maintenance tasks");
                return StatusCode(500, new { message = "Error retrieving overdue tasks" });
            }
        }

        // GET: api/maintenance/upcoming
        [HttpGet("upcoming")]
        public async Task<ActionResult<IEnumerable<MaintenanceTaskDto>>> GetUpcomingTasks([FromQuery] int days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow;
                var endDate = startDate.AddDays(days);

                var upcomingTasks = await _context.Set<MaintenanceTask>()
                    .Include(t => t.Vehicle)
                    .Include(t => t.Category)
                    .AsNoTracking()
                    .Where(t => t.Status == "Scheduled" &&
                               t.ScheduledDate >= startDate &&
                               t.ScheduledDate <= endDate)
                    .OrderBy(t => t.ScheduledDate)
                    .ToListAsync();

                return Ok(upcomingTasks.Select(t => MapToDto(t)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming maintenance tasks");
                return StatusCode(500, new { message = "Error retrieving upcoming tasks" });
            }
        }

        // GET: api/maintenance/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<MaintenanceCategoryDto>>> GetCategories()
        {
            try
            {
                var categories = await _context.Set<MaintenanceCategory>()
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(categories.Select(c => new MaintenanceCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    DefaultIntervalMiles = c.DefaultIntervalMiles,
                    DefaultIntervalMonths = c.DefaultIntervalMonths,
                    CreatedAt = c.CreatedAt
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving maintenance categories");
                return StatusCode(500, new { message = "Error retrieving categories" });
            }
        }

        // POST: api/maintenance/categories
        [HttpPost("categories")]
        public async Task<ActionResult<MaintenanceCategoryDto>> CreateCategory(MaintenanceCategoryDto dto)
        {
            try
            {
                var category = new MaintenanceCategory
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    DefaultIntervalMiles = dto.DefaultIntervalMiles,
                    DefaultIntervalMonths = dto.DefaultIntervalMonths,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Set<MaintenanceCategory>().Add(category);
                await _context.SaveChangesAsync();

                // ✅ AUDIT LOG - CREATE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "CREATE",
                    "MaintenanceCategory",
                    category.Id.ToString(),
                    $"Created maintenance category: {dto.Name}",
                    null,
                    new { category.Name, dto.DefaultIntervalMiles, dto.DefaultIntervalMonths }
                );

                dto.Id = category.Id;
                dto.CreatedAt = category.CreatedAt;

                return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating maintenance category");
                return StatusCode(500, new { message = "Error creating maintenance category" });
            }
        }

        // GET: api/maintenance/reminders
        [HttpGet("reminders")]
        public async Task<ActionResult<IEnumerable<MaintenanceReminderDto>>> GetReminders([FromQuery] string? vehicleId = null)
        {
            try
            {
                var query = _context.Set<MaintenanceReminder>()
                    .Include(r => r.Vehicle)
                    .Include(r => r.Category)
                    .AsNoTracking()
                    .Where(r => r.IsActive)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(vehicleId))
                    query = query.Where(r => r.VehicleId == vehicleId);

                var reminders = await query.ToListAsync();

                return Ok(reminders.Select(r => new MaintenanceReminderDto
                {
                    Id = r.Id,
                    VehicleId = r.VehicleId,
                    CategoryId = r.CategoryId,
                    ReminderType = r.ReminderType,
                    NextServiceMiles = r.NextServiceMiles,
                    NextServiceDate = r.NextServiceDate,
                    IntervalMiles = r.IntervalMiles,
                    IntervalMonths = r.IntervalMonths,
                    LastServiceDate = r.LastServiceDate,
                    LastServiceMiles = r.LastServiceMiles,
                    IsActive = r.IsActive,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    Vehicle = r.Vehicle == null ? null : new VehicleSimpleDto
                    {
                        Id = r.Vehicle.Id,
                        Make = r.Vehicle.Make,
                        Model = r.Vehicle.Model,
                        LicensePlate = r.Vehicle.LicensePlate
                    },
                    Category = r.Category == null ? null : new MaintenanceCategoryDto
                    {
                        Id = r.Category.Id,
                        Name = r.Category.Name,
                        Description = r.Category.Description,
                        DefaultIntervalMiles = r.Category.DefaultIntervalMiles,
                        DefaultIntervalMonths = r.Category.DefaultIntervalMonths,
                        CreatedAt = r.Category.CreatedAt
                    }
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving maintenance reminders");
                return StatusCode(500, new { message = "Error retrieving reminders" });
            }
        }

        // POST: api/maintenance/reminders
        [HttpPost("reminders")]
        public async Task<ActionResult<MaintenanceReminderDto>> CreateReminder(MaintenanceReminderDto dto)
        {
            try
            {
                var reminder = new MaintenanceReminder
                {
                    VehicleId = dto.VehicleId,
                    CategoryId = dto.CategoryId,
                    ReminderType = dto.ReminderType,
                    NextServiceMiles = dto.NextServiceMiles,
                    NextServiceDate = dto.NextServiceDate,
                    IntervalMiles = dto.IntervalMiles,
                    IntervalMonths = dto.IntervalMonths,
                    LastServiceDate = dto.LastServiceDate,
                    LastServiceMiles = dto.LastServiceMiles,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Set<MaintenanceReminder>().Add(reminder);
                await _context.SaveChangesAsync();

                // ✅ AUDIT LOG - CREATE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "CREATE",
                    "MaintenanceReminder",
                    reminder.Id.ToString(),
                    $"Created maintenance reminder for vehicle {dto.VehicleId}",
                    null,
                    new { reminder.ReminderType, dto.NextServiceDate, dto.IntervalMiles }
                );

                dto.Id = reminder.Id;
                dto.CreatedAt = reminder.CreatedAt;
                dto.UpdatedAt = reminder.UpdatedAt;

                return CreatedAtAction(nameof(GetReminders), new { id = reminder.Id }, dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating maintenance reminder");
                return StatusCode(500, new { message = "Error creating reminder" });
            }
        }

        // GET: api/maintenance/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<object>> GetStatistics()
        {
            try
            {
                var totalTasks = await _context.Set<MaintenanceTask>().CountAsync();
                var completedTasks = await _context.Set<MaintenanceTask>().CountAsync(t => t.Status == "Completed");
                var overdueTasks = await _context.Set<MaintenanceTask>()
                    .CountAsync(t => t.Status != "Completed" && t.Status != "Cancelled" && t.ScheduledDate < DateTime.UtcNow);
                var scheduledTasks = await _context.Set<MaintenanceTask>().CountAsync(t => t.Status == "Scheduled");
                var inProgressTasks = await _context.Set<MaintenanceTask>().CountAsync(t => t.Status == "InProgress");

                var totalCost = await _context.Set<MaintenanceTask>()
                    .Where(t => t.Status == "Completed")
                    .SumAsync(t => t.ActualCost ?? t.EstimatedCost ?? 0);

                return new
                {
                    totalTasks,
                    completedTasks,
                    overdueTasks,
                    scheduledTasks,
                    inProgressTasks,
                    totalCost
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving maintenance statistics");
                return StatusCode(500, new { message = "Error retrieving statistics" });
            }
        }

        // Helper method to map entity to DTO
        private MaintenanceTaskDto MapToDto(MaintenanceTask task)
        {
            return new MaintenanceTaskDto
            {
                Id = task.Id,
                VehicleId = task.VehicleId,
                CategoryId = task.CategoryId,
                TaskType = task.TaskType,
                Description = task.Description,
                Priority = task.Priority,
                Status = task.Status,
                ScheduledDate = task.ScheduledDate,
                CompletedDate = task.CompletedDate,
                ScheduledMileage = task.ScheduledMileage,
                CompletedMileage = task.CompletedMileage,
                EstimatedCost = task.EstimatedCost,
                ActualCost = task.ActualCost,
                AssignedTo = task.AssignedTo,
                TechnicianNotes = task.TechnicianNotes,
                PartsUsed = task.PartsUsed,
                LaborHours = task.LaborHours,
                ServiceProvider = task.ServiceProvider,
                WarrantyUntil = task.WarrantyUntil,
                CreatedBy = task.CreatedBy,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                Vehicle = task.Vehicle == null ? null : new VehicleSimpleDto
                {
                    Id = task.Vehicle.Id,
                    Make = task.Vehicle.Make,
                    Model = task.Vehicle.Model,
                    LicensePlate = task.Vehicle.LicensePlate
                },
                Category = task.Category == null ? null : new MaintenanceCategoryDto
                {
                    Id = task.Category.Id,
                    Name = task.Category.Name,
                    Description = task.Category.Description,
                    DefaultIntervalMiles = task.Category.DefaultIntervalMiles,
                    DefaultIntervalMonths = task.Category.DefaultIntervalMonths,
                    CreatedAt = task.Category.CreatedAt
                }
            };
        }
    }
}
