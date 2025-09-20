using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IDriverRepository : IRepository<Driver>
    {
        Task<IEnumerable<Driver>> GetActiveDriversAsync();
        new Task<Driver?> GetByIdAsync(string id);
        Task<Driver> CreateAsync(Driver driver);
        Task<bool> UpdateAsync(Driver driver);
        Task<bool> DeleteAsync(string id);
    }
}
