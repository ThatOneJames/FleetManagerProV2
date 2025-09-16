using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IDriverRepository : IRepository<Driver>
    {
        Task<IEnumerable<Driver>> GetActiveDriversAsync();
    }
}
