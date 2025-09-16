using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class DriverRepository : Repository<Driver>, IDriverRepository
    {
        private readonly DbContext _context;

        public DriverRepository(DbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Driver>> GetActiveDriversAsync()
        {
            return await _context.Set<Driver>()
                .Where(d => d.IsActive)
                .ToListAsync();
        }
    }
}
