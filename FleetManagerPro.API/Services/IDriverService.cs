using FleetManagerPro.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Services
{
    public interface IDriverService
    {
        Task<IEnumerable<Driver>> GetAllAsync();
        Task<Driver?> GetByIdAsync(int id);
        Task<Driver> CreateAsync(Driver driver);
        Task<bool> UpdateAsync(Driver driver);
        Task<bool> DeleteAsync(int id);
    }
}