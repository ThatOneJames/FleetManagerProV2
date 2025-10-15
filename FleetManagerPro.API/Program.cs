using FleetManagerPro.API;
using FleetManagerPro.API.Services;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Data.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

var mysqlHost = Environment.GetEnvironmentVariable("MYSQLHOST");
var mysqlPort = Environment.GetEnvironmentVariable("MYSQLPORT");
var mysqlDb = Environment.GetEnvironmentVariable("MYSQLDATABASE");
var mysqlUser = Environment.GetEnvironmentVariable("MYSQLUSER");
var mysqlPass = Environment.GetEnvironmentVariable("MYSQLPASSWORD");

string connectionString;

if (!string.IsNullOrEmpty(mysqlHost))
{
    connectionString = $"Server={mysqlHost};Port={mysqlPort};Database={mysqlDb};User={mysqlUser};Password={mysqlPass};SslMode=Required;";
    Console.WriteLine($"[DATABASE] Using Railway MySQL: {mysqlHost}");
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
    Console.WriteLine("[DATABASE] Using local MySQL connection");
}

builder.Services.AddDbContext<FleetManagerDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Configure Email Settings - read from environment variables for production
var emailSmtpServer = Environment.GetEnvironmentVariable("EMAIL_SMTP_SERVER") ?? builder.Configuration["EmailSettings:SmtpServer"];
var emailSmtpPort = Environment.GetEnvironmentVariable("EMAIL_SMTP_PORT") ?? builder.Configuration["EmailSettings:SmtpPort"];
var emailSenderEmail = Environment.GetEnvironmentVariable("EMAIL_SENDER_EMAIL") ?? builder.Configuration["EmailSettings:SenderEmail"];
var emailSenderName = Environment.GetEnvironmentVariable("EMAIL_SENDER_NAME") ?? builder.Configuration["EmailSettings:SenderName"];
var emailUsername = Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? builder.Configuration["EmailSettings:Username"];
var emailPassword = Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? builder.Configuration["EmailSettings:Password"];

builder.Configuration["EmailSettings:SmtpServer"] = emailSmtpServer;
builder.Configuration["EmailSettings:SmtpPort"] = emailSmtpPort;
builder.Configuration["EmailSettings:SenderEmail"] = emailSenderEmail;
builder.Configuration["EmailSettings:SenderName"] = emailSenderName;
builder.Configuration["EmailSettings:Username"] = emailUsername;
builder.Configuration["EmailSettings:Password"] = emailPassword;

Console.WriteLine($"[EMAIL] Using Gmail SMTP");
Console.WriteLine($"[EMAIL] Sender: {emailSenderEmail}");

builder.Services.AddHttpClient();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<VehicleService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<ILeaveRequestRepository, LeaveRequestRepository>();
builder.Services.AddScoped<ILeaveRequestService, LeaveRequestService>();
builder.Services.AddScoped<IMaintenanceTaskRepository, MaintenanceTaskRepository>();
builder.Services.AddScoped<IMaintenanceCategoryRepository, MaintenanceCategoryRepository>();
builder.Services.AddScoped<IMaintenanceReminderRepository, MaintenanceReminderRepository>();
builder.Services.AddScoped<IRouteRepository, RouteRepository>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Only enable email notifications in Development (localhost)
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddHostedService<NotificationBackgroundService>();
    Console.WriteLine("[EMAIL] Background email service enabled (localhost only)");
}
else
{
    Console.WriteLine("[EMAIL] Background email service DISABLED (production)");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "https://fleetmanagerpro-31c36.web.app",
                "https://fleetmanagerpro-31c36.firebaseapp.com"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

Console.WriteLine($"[JWT CONFIG] Key: {jwtKey?.Substring(0, 10)}...");
Console.WriteLine($"[JWT CONFIG] Issuer: {jwtIssuer}");
Console.WriteLine($"[JWT CONFIG] Audience: {jwtAudience}");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"[JWT] Authentication failed: {context.Exception.Message}");
            Console.WriteLine($"[JWT] Exception type: {context.Exception.GetType().Name}");
            if (context.Exception.InnerException != null)
            {
                Console.WriteLine($"[JWT] Inner exception: {context.Exception.InnerException.Message}");
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine($"[JWT] Token validated successfully");
            Console.WriteLine($"[JWT] User: {context.Principal?.Identity?.Name}");
            var claims = context.Principal?.Claims?.Select(c => $"{c.Type}={c.Value}");
            Console.WriteLine($"[JWT] Claims: {string.Join(", ", claims ?? Array.Empty<string>())}");
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Console.WriteLine($"[JWT] Challenge triggered: {context.Error}");
            Console.WriteLine($"[JWT] Error description: {context.ErrorDescription}");
            return Task.CompletedTask;
        },
        OnMessageReceived = context =>
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            if (!string.IsNullOrEmpty(token))
            {
                Console.WriteLine($"[JWT] Token received: {token.Substring(0, Math.Min(50, token.Length))}...");
            }
            else
            {
                Console.WriteLine("[JWT] No token received in Authorization header");
            }
            return Task.CompletedTask;
        }
    };

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FleetManagerDbContext>();
    try
    {
        Console.WriteLine("[DATABASE] Running migrations...");
        db.Database.Migrate();
        Console.WriteLine("[DATABASE] Migrations completed successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DATABASE] Migration error: {ex.Message}");
    }
}

// CRITICAL: CORS must come BEFORE UseHttpsRedirection
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/weatherforecast", () =>
{
    var summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

Console.WriteLine("[SERVER] Starting application with JWT authentication...");
Console.WriteLine("[CORS] Enabled for localhost:4200 and Firebase hosting");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
