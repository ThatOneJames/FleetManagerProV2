using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IMaintenanceRecordRepository : IRepository<MaintenanceRecord>
    {
        Task<IEnumerable<MaintenanceRecord>> GetByVehicleAsync(string vehicleId);
        Task<IEnumerable<MaintenanceRecord>> GetByStatusAsync(MaintenanceStatus status);
        Task<IEnumerable<MaintenanceRecord>> GetSchedulesAsync();
        Task<IEnumerable<MaintenanceRecord>> GetOverdueAsync();
    }
}
