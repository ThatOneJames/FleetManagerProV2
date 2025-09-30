using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class MaintenanceTaskRepository : Repository<MaintenanceTask>, IMaintenanceTaskRepository
    {
        private readonly FleetManagerDbContext _context;

        public MaintenanceTaskRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MaintenanceTask>> GetByVehicleAsync(string vehicleId)
        {
            return await _context.MaintenanceTasks
                .Include(t => t.Vehicle)
                .Include(t => t.Category)
                .Where(t => t.VehicleId == vehicleId)
                .OrderByDescending(t => t.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceTask>> GetByStatusAsync(string status)
        {
            return await _context.MaintenanceTasks
                .Include(t => t.Vehicle)
                .Include(t => t.Category)
                .Where(t => t.Status == status)
                .OrderByDescending(t => t.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceTask>> GetByPriorityAsync(string priority)
        {
            return await _context.MaintenanceTasks
                .Include(t => t.Vehicle)
                .Include(t => t.Category)
                .Where(t => t.Priority == priority)
                .OrderByDescending(t => t.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceTask>> GetOverdueAsync()
        {
            return await _context.MaintenanceTasks
                .Include(t => t.Vehicle)
                .Include(t => t.Category)
                .Where(t => t.Status != "Completed" &&
                           t.Status != "Cancelled" &&
                           t.ScheduledDate < DateTime.UtcNow)
                .OrderBy(t => t.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceTask>> GetUpcomingAsync(int days)
        {
            var startDate = DateTime.UtcNow;
            var endDate = startDate.AddDays(days);

            return await _context.MaintenanceTasks
                .Include(t => t.Vehicle)
                .Include(t => t.Category)
                .Where(t => t.Status == "Scheduled" &&
                           t.ScheduledDate >= startDate &&
                           t.ScheduledDate <= endDate)
                .OrderBy(t => t.ScheduledDate)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalCostAsync()
        {
            return await _context.MaintenanceTasks
                .Where(t => t.ActualCost.HasValue)
                .SumAsync(t => t.ActualCost.Value);
        }
    }

    public class MaintenanceCategoryRepository : Repository<MaintenanceCategory>, IMaintenanceCategoryRepository
    {
        private readonly FleetManagerDbContext _context;

        public MaintenanceCategoryRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<MaintenanceCategory?> GetByNameAsync(string name)
        {
            return await _context.MaintenanceCategories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        }
    }

    public class MaintenanceReminderRepository : Repository<MaintenanceReminder>, IMaintenanceReminderRepository
    {
        private readonly FleetManagerDbContext _context;

        public MaintenanceReminderRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MaintenanceReminder>> GetByVehicleAsync(string vehicleId)
        {
            return await _context.MaintenanceReminders
                .Include(r => r.Vehicle)
                .Include(r => r.Category)
                .Where(r => r.VehicleId == vehicleId)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceReminder>> GetActiveRemindersAsync()
        {
            return await _context.MaintenanceReminders
                .Include(r => r.Vehicle)
                .Include(r => r.Category)
                .Where(r => r.IsActive)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceReminder>> GetDueRemindersAsync()
        {
            var today = DateTime.UtcNow;

            return await _context.MaintenanceReminders
                .Include(r => r.Vehicle)
                .Include(r => r.Category)
                .Where(r => r.IsActive &&
                           (r.NextServiceDate.HasValue && r.NextServiceDate.Value <= today.AddDays(30)))
                .ToListAsync();
        }
    }
}