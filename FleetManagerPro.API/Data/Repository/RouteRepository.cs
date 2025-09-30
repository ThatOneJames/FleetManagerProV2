using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using RouteModel = FleetManagerPro.API.Models.Route;

namespace FleetManagerPro.API.Data.Repository
{
    public class RouteRepository : Repository<RouteModel>, IRouteRepository
    {
        private readonly FleetManagerDbContext _context;

        public RouteRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RouteModel>> GetRoutesByVehicleAsync(string vehicleId)
        {
            return await _context.Set<RouteModel>()
                .Where(r => r.VehicleId == vehicleId)
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<RouteModel>> GetRoutesByDriverAsync(string driverId)
        {
            return await _context.Set<RouteModel>()
                .Where(r => r.DriverId == driverId)
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<RouteModel>> GetRoutesByStatusAsync(string status)
        {
            return await _context.Set<RouteModel>()
                .Where(r => r.Status == status)
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<RouteModel?> GetRouteWithStopsAsync(string routeId)
        {
            return await _context.Set<RouteModel>()
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                .FirstOrDefaultAsync(r => r.Id == routeId);
        }

        public async Task<IEnumerable<RouteModel>> GetActiveRoutesAsync()
        {
            return await _context.Set<RouteModel>()
                .Where(r => r.Status == "in_progress" || r.Status == "planned")
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops.OrderBy(s => s.StopOrder))
                .OrderBy(r => r.StartTime)
                .ToListAsync();
        }

        public async Task<RouteStop?> GetRouteStopAsync(string stopId)
        {
            return await _context.Set<RouteStop>()
                .Include(s => s.Route)
                .FirstOrDefaultAsync(s => s.Id == stopId);
        }

        public async Task UpdateRouteStopAsync(RouteStop stop)
        {
            _context.Set<RouteStop>().Update(stop);
            await _context.SaveChangesAsync();
        }
    }
}