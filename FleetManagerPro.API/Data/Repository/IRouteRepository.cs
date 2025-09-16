using FleetManagerPro.API.Models;
using Route = FleetManagerPro.API.Models.Route;


namespace FleetManagerPro.API.Data.Repository
{
    public interface IRouteRepository : IRepository<Route>
    {
        Task<IEnumerable<Route>> GetRoutesByVehicleAsync(string vehicleId);
    }
}
