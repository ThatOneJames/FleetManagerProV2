using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data.Repository;
using System.Collections.Generic;
using System.Threading.Tasks;
using FleetManagerPro.API.Services;

namespace FleetManagerPro.API.Services
{
    public class DriverService : IDriverService
    {
        private readonly IDriverRepository _driverRepository;

        public DriverService(IDriverRepository driverRepository)
        {
            _driverRepository = driverRepository;
        }

        public async Task<IEnumerable<Driver>> GetAllAsync()
        {
            return await _driverRepository.GetAllAsync();
        }

        public async Task<Driver?> GetByIdAsync(string id)
        {
            return await _driverRepository.GetByIdAsync(id);
        }

        public async Task<Driver> CreateAsync(Driver driver)
        {
            return await _driverRepository.CreateAsync(driver);
        }

        public async Task<bool> UpdateAsync(Driver driver)
        {
            return await _driverRepository.UpdateAsync(driver);
        }

        public async Task<bool> DeleteAsync(string id)
        {
            return await _driverRepository.DeleteAsync(id);
        }
    }
}
