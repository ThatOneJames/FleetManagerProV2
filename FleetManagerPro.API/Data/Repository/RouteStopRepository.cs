using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using Route = FleetManagerPro.API.Models.Route;


namespace FleetManagerPro.API.Data.Repository
{
    public class RouteStopRepository : Repository<RouteStop>, IRouteStopRepository
    {
        private readonly FleetManagerDbContext _context;

        public RouteStopRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async new Task<IEnumerable<RouteStop>> GetStopsByRouteAsync(int routeId)
        {
            return await _context.Set<RouteStop>()
                .Where(s => s.RouteId == routeId)
                .ToListAsync();
        }
    }
}
