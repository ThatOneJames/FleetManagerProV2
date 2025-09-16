using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class MaintenanceRecordRepository : Repository<MaintenanceRecord>, IMaintenanceRecordRepository
    {
        private readonly DbContext _context;

        public MaintenanceRecordRepository(DbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MaintenanceRecord>> GetByVehicleAsync(string vehicleId)
        {
            return await _context.Set<MaintenanceRecord>()
                .Where(r => r.VehicleId == vehicleId)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceRecord>> GetByStatusAsync(MaintenanceStatus status)
        {
            return await _context.Set<MaintenanceRecord>()
                .Where(r => r.Status == status)
                .ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceSchedule>> GetSchedulesAsync()
        {
            return await _context.Set<MaintenanceSchedule>().ToListAsync();
        }

        public async Task<IEnumerable<MaintenanceSchedule>> GetOverdueAsync()
        {
            return await _context.Set<MaintenanceSchedule>()
                .Where(s => s.DueDate < DateTime.UtcNow)
                .ToListAsync();
        }
    }
}
