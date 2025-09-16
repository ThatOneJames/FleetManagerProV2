using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IRouteStopRepository : IRepository<RouteStop>
    {
        Task<IEnumerable<RouteStop>> GetStopsByRouteAsync(int routeId);
    }
}
