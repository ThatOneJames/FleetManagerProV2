using System.Threading.Tasks;

namespace FleetManagerPro.API.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(string userId, string message);
    }

    public class NotificationService : INotificationService
    {
        public Task SendNotificationAsync(string userId, string message)
        {
            // TODO: Add real push/in-app notification logic here
            return Task.CompletedTask;
        }
    }
}
