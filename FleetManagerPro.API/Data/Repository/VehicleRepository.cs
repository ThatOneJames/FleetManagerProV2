using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Data.Repository
{
    public class VehicleRepository : Repository<Vehicle>, IVehicleRepository
    {
        private readonly FleetManagerDbContext _context;

        public VehicleRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Vehicle>> GetAllAsync()
        {
            return await _context.Vehicles
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .ToListAsync();
        }

        public async Task<Vehicle?> GetByIdAsync(string id)
        {
            return await _context.Vehicles
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        // FIX: Changed from enum comparison to string comparison
        public async Task<IEnumerable<Vehicle>> GetAvailableVehiclesAsync()
        {
            return await _context.Vehicles
                .Where(v => v.Status == "Ready" || v.Status == "Active") // String comparison instead of VehicleStatus.Ready
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .ToListAsync();
        }

        // FIX: Changed parameter and comparison to use strings
        public async Task<IEnumerable<Vehicle>> GetByStatusAsync(string status)
        {
            return await _context.Vehicles
                .Where(v => v.Status == status) // Direct string comparison
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .ToListAsync();
        }

        public async Task<IEnumerable<Vehicle>> GetByCategoryAsync(string categoryId)
        {
            return await _context.Vehicles
                .Where(v => v.CategoryId == categoryId)
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .ToListAsync();
        }

        public async Task<Vehicle?> GetByLicensePlateAsync(string licensePlate)
        {
            return await _context.Vehicles
                .Where(v => v.LicensePlate.ToLower() == licensePlate.ToLower())
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Vehicle>> GetByDriverAsync(string driverId)
        {
            return await _context.Vehicles
                .Where(v => v.CurrentDriverId == driverId)
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .ToListAsync();
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
            {
                return false;
            }

            _context.Vehicles.Remove(vehicle);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<Vehicle> CreateAsync(Vehicle vehicle)
        {
            vehicle.CreatedAt = DateTime.UtcNow;
            vehicle.UpdatedAt = DateTime.UtcNow;
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            return vehicle;
        }

        public async Task<bool> UpdateAsync(Vehicle vehicle)
        {
            vehicle.UpdatedAt = DateTime.UtcNow;
            _context.Vehicles.Update(vehicle);
            return await _context.SaveChangesAsync() > 0;
        }

        // Helper method to get vehicles with expiring registrations
        public async Task<IEnumerable<Vehicle>> GetExpiringRegistrationsAsync(DateTime thresholdDate)
        {
            return await _context.Vehicles
                .Where(v => v.RegistrationExpiry <= thresholdDate)
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .ToListAsync();
        }

        // Helper method to get vehicles with expiring insurance
        public async Task<IEnumerable<Vehicle>> GetExpiringInsuranceAsync(DateTime thresholdDate)
        {
            return await _context.Vehicles
                .Where(v => v.InsuranceExpiry <= thresholdDate)
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .ToListAsync();
        }
    }
}