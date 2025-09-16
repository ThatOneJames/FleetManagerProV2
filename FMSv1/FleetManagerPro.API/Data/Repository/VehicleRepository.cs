using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class VehicleRepository : Repository<Vehicle>, IVehicleRepository
    {
        private readonly DbContext _context;

        public VehicleRepository(DbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Vehicle>> GetAvailableVehiclesAsync()
        {
            return await _context.Set<Vehicle>()
                .Where(v => v.Status == VehicleStatus.Ready)
                .ToListAsync();
        }
    }
}
