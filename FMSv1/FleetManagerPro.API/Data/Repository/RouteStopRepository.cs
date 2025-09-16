using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class RouteStopRepository : Repository<RouteStop>, IRouteStopRepository
    {
        private readonly DbContext _context;

        public RouteStopRepository(DbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RouteStop>> GetStopsByRouteAsync(int routeId)
        {
            return await _context.Set<RouteStop>()
                .Where(s => s.RouteId == routeId)
                .ToListAsync();
        }
    }
}
