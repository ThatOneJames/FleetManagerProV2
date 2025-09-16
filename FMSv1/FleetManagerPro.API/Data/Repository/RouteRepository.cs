using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class RouteRepository : Repository<Route>, IRouteRepository
    {
        private readonly DbContext _context;

        public RouteRepository(DbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Route>> GetRoutesByVehicleAsync(string vehicleId)
        {
            return await _context.Set<Route>()
                .Where(r => r.VehicleId == vehicleId)
                .Include(r => r.Stops)
                .ToListAsync();
        }
    }
}
