using FleetManagerPro.API.Data;
using FleetManagerPro.API.Services;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Services
{
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NotificationBackgroundService> _logger;

        public NotificationBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<NotificationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingNotifications();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing notifications");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ProcessPendingNotifications()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<FleetManagerDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var pendingNotifications = await context.Notifications
                .Include(n => n.User)
                .Where(n => !n.IsSent && n.SendEmail)
                .ToListAsync();

            foreach (var notification in pendingNotifications)
            {
                if (!string.IsNullOrEmpty(notification.User?.Email))
                {
                    await emailService.SendEmailAsync(
                        notification.User.Email,
                        notification.Title,
                        $"<h2>{notification.Title}</h2><p>{notification.Message}</p>"
                    );

                    notification.IsSent = true;
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
