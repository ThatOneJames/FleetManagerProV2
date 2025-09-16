using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IDriverRepository : IRepository<Driver>
    {
        Task<IEnumerable<Driver>> GetActiveDriversAsync();
        Task<Driver> CreateAsync(Driver driver);
        Task<bool> UpdateAsync(Driver driver);
        Task<bool> DeleteAsync(int id);
    }
}
