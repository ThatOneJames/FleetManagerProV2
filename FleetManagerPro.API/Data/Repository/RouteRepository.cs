using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using Route = FleetManagerPro.API.Models.Route;


namespace FleetManagerPro.API.Data.Repository
{
    public class RouteRepository : Repository<Route>, IRouteRepository
    {
        private readonly FleetManagerDbContext _context;

        public RouteRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async new Task<IEnumerable<Route>> GetRoutesByVehicleAsync(string vehicleId)
        {
            if (int.TryParse(vehicleId, out int idAsInt))
            {
                return await _context.Set<Route>()
               .Where(r => r.VehicleId == idAsInt)
               .Include(r => r.Stops)
               .ToListAsync();
            }

            return new List<Route>();
        }
    }
}