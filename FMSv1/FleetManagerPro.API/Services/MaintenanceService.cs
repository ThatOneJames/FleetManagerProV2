using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Services
{
    public class MaintenanceService
    {
        private readonly AppDbContext _context;

        public MaintenanceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MaintenanceRecord>> GetAllAsync()
        {
            return await _context.MaintenanceRecords
                .Include(m => m.Vehicle)
                .ToListAsync();
        }

        public async Task<MaintenanceRecord?> GetByIdAsync(int id)
        {
            return await _context.MaintenanceRecords
                .Include(m => m.Vehicle)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<MaintenanceRecord> CreateAsync(MaintenanceRecord record)
        {
            _context.MaintenanceRecords.Add(record);
            await _context.SaveChangesAsync();
            return record;
        }

        public async Task<MaintenanceRecord?> UpdateAsync(int id, MaintenanceRecord record)
        {
            var existing = await _context.MaintenanceRecords.FindAsync(id);
            if (existing == null) return null;

            existing.Description = record.Description;
            existing.Date = record.Date;
            existing.Cost = record.Cost;
            existing.VehicleId = record.VehicleId;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _context.MaintenanceRecords.FindAsync(id);
            if (existing == null) return false;

            _context.MaintenanceRecords.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
