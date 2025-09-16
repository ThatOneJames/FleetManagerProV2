using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Data.Repository
{
    public class DriverRepository : Repository<Driver>, IDriverRepository
    {
        private new readonly FleetManagerDbContext _context;

        public DriverRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async new Task<IEnumerable<Driver>> GetAllAsync()
        {
            return await _context.Drivers.ToListAsync();
        }

        public async new Task<Driver?> GetByIdAsync(int id)
        {
            return await _context.Drivers.FindAsync(id);
        }

        public async Task<IEnumerable<Driver>> GetActiveDriversAsync()
        {
            return await _context.Drivers
                .Where(d => d.IsAvailable)
                .ToListAsync();
        }

        public async new Task<Driver> CreateAsync(Driver driver)
        {
            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();
            return driver;
        }

        public async Task<bool> UpdateAsync(Driver driver)
        {
            _context.Drivers.Update(driver);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var driver = await GetByIdAsync(id);
            if (driver == null) return false;

            _context.Drivers.Remove(driver);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
