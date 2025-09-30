using FleetManagerPro.API.Models;
using RouteModel = FleetManagerPro.API.Models.Route;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IRouteRepository : IRepository<RouteModel>
    {
        Task<IEnumerable<RouteModel>> GetRoutesByVehicleAsync(string vehicleId);
        Task<IEnumerable<RouteModel>> GetRoutesByDriverAsync(string driverId);
        Task<IEnumerable<RouteModel>> GetRoutesByStatusAsync(string status);
        Task<RouteModel?> GetRouteWithStopsAsync(string routeId);
        Task<IEnumerable<RouteModel>> GetActiveRoutesAsync();
        Task<RouteStop?> GetRouteStopAsync(string stopId);
        Task UpdateRouteStopAsync(RouteStop stop);
    }
}