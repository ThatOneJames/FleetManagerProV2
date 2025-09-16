using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IVehicleRepository : IRepository<Vehicle>
    {
        Task<IEnumerable<Vehicle>> GetAvailableVehiclesAsync();
    }
}
