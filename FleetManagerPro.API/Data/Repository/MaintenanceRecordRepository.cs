using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class MaintenanceRecordRepository : Repository<MaintenanceRecord>, IMaintenanceRecordRepository
    {
        private readonly FleetManagerDbContext _context;

        public MaintenanceRecordRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async new Task<IEnumerable<MaintenanceRecord>> GetByVehicleAsync(string vehicleId)
        {
            return await _context.Set<MaintenanceRecord>()
                .Where(r => r.VehicleId == vehicleId)
                .ToListAsync();
        }

        public async new Task<IEnumerable<MaintenanceRecord>> GetByStatusAsync(MaintenanceStatus status)
        {
            return await _context.Set<MaintenanceRecord>()
                .Where(r => r.Status == status)
                .ToListAsync();
        }

        public async new Task<IEnumerable<MaintenanceRecord>> GetSchedulesAsync()
        {
            return await _context.Set<MaintenanceRecord>().ToListAsync();
        }

        public async new Task<IEnumerable<MaintenanceRecord>> GetOverdueAsync()
        {
            return await _context.Set<MaintenanceRecord>()
                .Where(s => s.DueDate < DateTime.UtcNow)
                .ToListAsync();
        }
    }
}
