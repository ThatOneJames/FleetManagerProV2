using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IRouteRepository : IRepository<Route>
    {
        Task<IEnumerable<Route>> GetRoutesByVehicleAsync(string vehicleId);
    }
}
