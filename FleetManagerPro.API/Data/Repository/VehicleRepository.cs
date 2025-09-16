using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class VehicleRepository : Repository<Vehicle>, IVehicleRepository
    {
        private readonly FleetManagerDbContext _context;

        public VehicleRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async new Task<IEnumerable<Vehicle>> GetAvailableVehiclesAsync()
        {
            return await _context.Set<Vehicle>()
                .Where(v => v.Status == VehicleStatus.Ready)
                .ToListAsync();
        }
    }
}
