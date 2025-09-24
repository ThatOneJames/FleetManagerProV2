using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Services
{
    public class MaintenanceService
    {
        private readonly FleetManagerDbContext _context;

        public MaintenanceService(FleetManagerDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MaintenanceRecord>> GetAllAsync()
        {
            return await _context.MaintenanceRecords
                .Include(m => m.Vehicle)
                .ToListAsync();
        }

        public async Task<MaintenanceRecord?> GetByIdAsync(string id) // Changed 'int' to 'string'
        {
            return await _context.MaintenanceRecords
                .Include(m => m.Vehicle)
                .FirstOrDefaultAsync(m => m.Id == id); // The comparison is now string == string
        }

        public async Task<MaintenanceRecord> CreateAsync(MaintenanceRecord record)
        {
            _context.MaintenanceRecords.Add(record);
            await _context.SaveChangesAsync();
            return record;
        }

        public async Task<MaintenanceRecord?> UpdateAsync(string id, MaintenanceRecord record) // Changed 'int' to 'string'
        {
            // You should also change the FindAsync parameter to string
            var existing = await _context.MaintenanceRecords.FindAsync(id);
            if (existing == null) return null;

            existing.Description = record.Description;
            // ... (other property assignments)
            existing.VehicleId = record.VehicleId;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(string id) // Changed 'int' to 'string'
        {
            // You should also change the FindAsync parameter to string
            var existing = await _context.MaintenanceRecords.FindAsync(id);
            if (existing == null) return false;

            _context.MaintenanceRecords.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}