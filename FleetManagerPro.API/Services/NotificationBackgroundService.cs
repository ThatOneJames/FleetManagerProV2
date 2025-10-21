using FleetManagerPro.API.Data;
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
            _logger.LogInformation("NotificationBackgroundService started - checking every 30 seconds");
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
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
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

            if (pendingNotifications.Any())
            {
                _logger.LogInformation("Found {Count} pending notifications to send", pendingNotifications.Count);
            }

            foreach (var notification in pendingNotifications)
            {
                if (!string.IsNullOrEmpty(notification.User?.Email))
                {
                    try
                    {
                        await emailService.SendEmailAsync(
                            notification.User.Email,
                            notification.Title,
                            $"<h2>{notification.Title}</h2><p>{notification.Message}</p>"
                        );
                        notification.IsSent = true;
                        _logger.LogInformation("Email sent to {Email} - {Title}", notification.User.Email, notification.Title);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send email to {Email}", notification.User?.Email);
                    }
                }
            }

            if (pendingNotifications.Any(n => n.IsSent))
            {
                await context.SaveChangesAsync();
            }
        }
    }
}
