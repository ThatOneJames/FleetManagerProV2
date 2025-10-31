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
                string recipientEmail = null;

                try
                {
                    // Case 1: Verification Code - email in RelatedEntityId
                    if (notification.Type == "VerificationCode" && !string.IsNullOrEmpty(notification.RelatedEntityId))
                    {
                        recipientEmail = notification.RelatedEntityId;
                        _logger.LogInformation("Sending verification code to: {Email}", recipientEmail);
                    }
                    // Case 2: User notification - email from User
                    else if (!string.IsNullOrEmpty(notification.User?.Email))
                    {
                        recipientEmail = notification.User.Email;
                        _logger.LogInformation("Sending notification to user {UserId}: {Email}", notification.UserId, recipientEmail);
                    }
                    else
                    {
                        _logger.LogWarning("Notification {Id} has no recipient email (User: {UserId}, RelatedId: {RelatedId})",
                            notification.Id, notification.UserId, notification.RelatedEntityId);
                    }

                    // Send if we have an email
                    if (!string.IsNullOrEmpty(recipientEmail))
                    {
                        await emailService.SendEmailAsync(
                            recipientEmail,
                            notification.Title,
                            $"<h2>{notification.Title}</h2><p>{notification.Message}</p>"
                        );
                        notification.IsSent = true;
                        _logger.LogInformation("Email sent to {Email} - {Title}", recipientEmail, notification.Title);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send email to {Email} for notification {Id}", recipientEmail, notification.Id);
                }
            }

            // Save all changes
            if (pendingNotifications.Any(n => n.IsSent))
            {
                await context.SaveChangesAsync();
                _logger.LogInformation("Saved {Count} sent notifications", pendingNotifications.Count(n => n.IsSent));
            }
        }
    }
}
