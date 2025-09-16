using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using FleetManagerPro.DTOs; // adjust namespace if needed

namespace FleetManagerPro.Services
{
    public class DriverService
    {
        private readonly HttpClient _httpClient;

        public DriverService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // ✅ Get all drivers
        public async Task<List<DriverDto>> GetDriversAsync()
        {
            return await _httpClient.GetFromJsonAsync<List<DriverDto>>("api/drivers");
        }

        // ✅ Get driver by ID
        public async Task<DriverDto> GetDriverByIdAsync(int id)
        {
            return await _httpClient.GetFromJsonAsync<DriverDto>($"api/drivers/{id}");
        }

        // ✅ Add a driver
        public async Task<DriverDto> AddDriverAsync(DriverDto driver)
        {
            var response = await _httpClient.PostAsJsonAsync("api/drivers", driver);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<DriverDto>();
        }

        // ✅ Update a driver
        public async Task UpdateDriverAsync(int id, DriverDto driver)
        {
            var response = await _httpClient.PutAsJsonAsync($"api/drivers/{id}", driver);
            response.EnsureSuccessStatusCode();
        }

        // ✅ Delete a driver
        public async Task DeleteDriverAsync(int id)
        {
            var response = await _httpClient.DeleteAsync($"api/drivers/{id}");
            response.EnsureSuccessStatusCode();
        }
    }
}
