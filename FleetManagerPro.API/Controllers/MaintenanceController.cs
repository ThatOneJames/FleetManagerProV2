using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.DTOs;

namespace FleetManagerPro.API.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class MaintenanceController : ControllerBase
	{
		private readonly FleetManagerDbContext _context;

		public MaintenanceController(FleetManagerDbContext context)
		{
			_context = context;
		}

		// GET: api/maintenance/tasks
		[HttpGet("tasks")]
		public async Task<ActionResult<IEnumerable<MaintenanceTaskDto>>> GetAllTasks(
			[FromQuery] string? vehicleId = null,
			[FromQuery] string? status = null,
			[FromQuery] string? priority = null)
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

		// GET: api/maintenance/tasks/{id}
		[HttpGet("tasks/{id}")]
		public async Task<ActionResult<MaintenanceTaskDto>> GetTask(string id)
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

		// POST: api/maintenance/tasks
		[HttpPost("tasks")]
		public async Task<ActionResult<MaintenanceTaskDto>> CreateTask(CreateMaintenanceTaskDto dto)
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

			// Reload with navigation properties
			var createdTask = await _context.Set<MaintenanceTask>()
				.Include(t => t.Vehicle)
				.Include(t => t.Category)
				.AsNoTracking()
				.FirstOrDefaultAsync(t => t.Id == task.Id);

			return CreatedAtAction(nameof(GetTask), new { id = task.Id }, MapToDto(createdTask!));
		}

		// PUT: api/maintenance/tasks/{id}
		[HttpPut("tasks/{id}")]
		public async Task<IActionResult> UpdateTask(string id, UpdateMaintenanceTaskDto dto)
		{
			var existing = await _context.Set<MaintenanceTask>().FindAsync(id);
			if (existing == null)
				return NotFound(new { message = "Maintenance task not found" });

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
			return NoContent();
		}

		// DELETE: api/maintenance/tasks/{id}
		[HttpDelete("tasks/{id}")]
		public async Task<IActionResult> DeleteTask(string id)
		{
			var task = await _context.Set<MaintenanceTask>().FindAsync(id);
			if (task == null)
				return NotFound(new { message = "Maintenance task not found" });

			_context.Set<MaintenanceTask>().Remove(task);
			await _context.SaveChangesAsync();

			return NoContent();
		}

		// GET: api/maintenance/overdue
		[HttpGet("overdue")]
		public async Task<ActionResult<IEnumerable<MaintenanceTaskDto>>> GetOverdueTasks()
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

		// GET: api/maintenance/upcoming
		[HttpGet("upcoming")]
		public async Task<ActionResult<IEnumerable<MaintenanceTaskDto>>> GetUpcomingTasks([FromQuery] int days = 30)
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

		// GET: api/maintenance/categories
		[HttpGet("categories")]
		public async Task<ActionResult<IEnumerable<MaintenanceCategoryDto>>> GetCategories()
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

		// POST: api/maintenance/categories
		[HttpPost("categories")]
		public async Task<ActionResult<MaintenanceCategoryDto>> CreateCategory(MaintenanceCategoryDto dto)
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

			dto.Id = category.Id;
			dto.CreatedAt = category.CreatedAt;

			return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, dto);
		}

		// GET: api/maintenance/reminders
		[HttpGet("reminders")]
		public async Task<ActionResult<IEnumerable<MaintenanceReminderDto>>> GetReminders([FromQuery] string? vehicleId = null)
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

		// POST: api/maintenance/reminders
		[HttpPost("reminders")]
		public async Task<ActionResult<MaintenanceReminderDto>> CreateReminder(MaintenanceReminderDto dto)
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

			dto.Id = reminder.Id;
			dto.CreatedAt = reminder.CreatedAt;
			dto.UpdatedAt = reminder.UpdatedAt;

			return CreatedAtAction(nameof(GetReminders), new { id = reminder.Id }, dto);
		}

		// GET: api/maintenance/statistics
		[HttpGet("statistics")]
		public async Task<ActionResult<object>> GetStatistics()
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