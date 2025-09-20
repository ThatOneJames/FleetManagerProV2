using System.Collections.Generic;
using System.Threading.Tasks;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.DTOs;

namespace FleetManagerPro.API.Services
{
    public interface IDriverService
    {
        Task<IEnumerable<Driver>> GetAllAsync();
        Task<Driver?> GetByIdAsync(string id);
        Task<Driver> CreateAsync(Driver driver);
        Task<bool> UpdateAsync(Driver driver);
        Task<bool> DeleteAsync(string id);
    }
}
