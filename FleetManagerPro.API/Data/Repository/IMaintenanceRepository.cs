using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IMaintenanceTaskRepository : IRepository<MaintenanceTask>
    {
        Task<IEnumerable<MaintenanceTask>> GetByVehicleAsync(string vehicleId);
        Task<IEnumerable<MaintenanceTask>> GetByStatusAsync(string status);
        Task<IEnumerable<MaintenanceTask>> GetByPriorityAsync(string priority);
        Task<IEnumerable<MaintenanceTask>> GetOverdueAsync();
        Task<IEnumerable<MaintenanceTask>> GetUpcomingAsync(int days);
        Task<decimal> GetTotalCostAsync();
    }

    public interface IMaintenanceCategoryRepository : IRepository<MaintenanceCategory>
    {
        Task<MaintenanceCategory?> GetByNameAsync(string name);
    }

    public interface IMaintenanceReminderRepository : IRepository<MaintenanceReminder>
    {
        Task<IEnumerable<MaintenanceReminder>> GetByVehicleAsync(string vehicleId);
        Task<IEnumerable<MaintenanceReminder>> GetActiveRemindersAsync();
        Task<IEnumerable<MaintenanceReminder>> GetDueRemindersAsync();
    }
}