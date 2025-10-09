using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.DTOs;
using System.Security.Claims;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PreTripInspectionController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;
        private readonly ILogger<PreTripInspectionController> _logger;

        public PreTripInspectionController(FleetManagerDbContext context, ILogger<PreTripInspectionController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<PreTripInspection>> CreateInspection([FromBody] CreatePreTripInspectionDto dto)
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized("Driver not authenticated");
            }

            var route = await _context.Routes.FindAsync(dto.RouteId);
            if (route == null)
            {
                return NotFound("Route not found");
            }

            var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId);
            if (vehicle == null)
            {
                return NotFound("Vehicle not found");
            }

            var existingInspection = await _context.PreTripInspections
                .Include(i => i.MaintenanceRequest)
                .FirstOrDefaultAsync(i => i.RouteId == dto.RouteId);

            if (existingInspection != null)
            {
                if (existingInspection.AllItemsPassed)
                {
                    return BadRequest("Pre-trip inspection already passed for this route");
                }

                if (existingInspection.MaintenanceRequest != null &&
                    existingInspection.MaintenanceRequest.Status != "Completed")
                {
                    return BadRequest("Maintenance must be completed before submitting a new inspection");
                }

                _context.PreTripInspections.Remove(existingInspection);
            }

            var inspection = new PreTripInspection
            {
                Id = Guid.NewGuid().ToString(),
                RouteId = dto.RouteId,
                VehicleId = dto.VehicleId,
                DriverId = driverId,
                InspectionDate = DateTime.UtcNow,
                EngineOilOk = dto.EngineOilOk,
                CoolantOk = dto.CoolantOk,
                BatteryOk = dto.BatteryOk,
                BrakesOk = dto.BrakesOk,
                DashboardWarningLights = dto.DashboardWarningLights,
                TirePressureOk = dto.TirePressureOk,
                TireTreadOk = dto.TireTreadOk,
                TireDamageCheck = dto.TireDamageCheck,
                WheelLugsOk = dto.WheelLugsOk,
                HeadlightsOk = dto.HeadlightsOk,
                BrakeLightsOk = dto.BrakeLightsOk,
                TurnSignalsOk = dto.TurnSignalsOk,
                HazardLightsOk = dto.HazardLightsOk,
                SeatbeltsOk = dto.SeatbeltsOk,
                FireExtinguisherPresent = dto.FireExtinguisherPresent,
                FirstAidKitPresent = dto.FirstAidKitPresent,
                WarningTrianglesPresent = dto.WarningTrianglesPresent,
                MirrorsOk = dto.MirrorsOk,
                WindshieldWipersOk = dto.WindshieldWipersOk,
                HornWorking = dto.HornWorking,
                DoorsAndLocksOk = dto.DoorsAndLocksOk,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            inspection.AllItemsPassed = CheckAllItemsPassed(inspection);

            if (!inspection.AllItemsPassed)
            {
                inspection.IssuesFound = GetFailedItems(inspection);
                inspection.Result = "Fail";
            }
            else
            {
                inspection.Result = "Pass";
            }

            _context.PreTripInspections.Add(inspection);

            if (!inspection.AllItemsPassed)
            {
                try
                {
                    var driver = await _context.Users.FindAsync(driverId);
                    var adminUsers = await _context.Users.Where(u => u.Role == "Admin").ToListAsync();

                    var failedItemsList = System.Text.Json.JsonSerializer.Deserialize<List<string>>(inspection.IssuesFound ?? "[]");
                    var failedItemsText = failedItemsList != null && failedItemsList.Count > 0
                        ? string.Join(", ", failedItemsList)
                        : "Multiple issues";

                    foreach (var admin in adminUsers)
                    {
                        var notification = new Notification
                        {
                            UserId = admin.Id,
                            Title = "⚠️ Failed Pre-Trip Inspection",
                            Message = $"{driver?.Name ?? "A driver"} reported issues with vehicle {vehicle.LicensePlate}: {failedItemsText}",
                            Type = "Warning",
                            Category = "Maintenance",
                            RelatedEntityType = "PreTripInspection",
                            RelatedEntityId = inspection.Id,
                            IsRead = false,
                            IsSent = false,
                            SendEmail = true,
                            SendSms = false,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.Notifications.Add(notification);
                    }

                    _logger.LogInformation("Created notification for failed inspection {InspectionId}", inspection.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating notification for failed inspection {InspectionId}", inspection.Id);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = inspection.Id,
                allItemsPassed = inspection.AllItemsPassed,
                result = inspection.Result,
                issuesFound = inspection.IssuesFound
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PreTripInspection>> GetInspectionById(string id)
        {
            var inspection = await _context.PreTripInspections
                .Include(i => i.Vehicle)
                .Include(i => i.Driver)
                .Include(i => i.Route)
                .Include(i => i.MaintenanceRequest)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (inspection == null)
            {
                return NotFound();
            }

            return Ok(inspection);
        }

        [HttpGet("route/{routeId}")]
        public async Task<ActionResult<object>> GetInspectionByRoute(string routeId)
        {
            var inspection = await _context.PreTripInspections
                .Include(i => i.Vehicle)
                .Include(i => i.Driver)
                .Include(i => i.MaintenanceRequest)
                .Where(i => i.RouteId == routeId)
                .OrderByDescending(i => i.InspectionDate)
                .FirstOrDefaultAsync();

            if (inspection == null)
            {
                return Ok(new
                {
                    hasInspection = false,
                    routeId = routeId,
                    message = "No inspection found for this route"
                });
            }

            return Ok(new
            {
                hasInspection = true,
                inspection = new
                {
                    id = inspection.Id,
                    vehicleId = inspection.VehicleId,
                    routeId = inspection.RouteId,
                    result = inspection.Result,
                    allItemsPassed = inspection.AllItemsPassed,
                    inspectionDate = inspection.InspectionDate,
                    notes = inspection.Notes,
                    createdAt = inspection.CreatedAt,
                    maintenanceRequest = inspection.MaintenanceRequest != null ? new
                    {
                        id = inspection.MaintenanceRequest.Id,
                        status = inspection.MaintenanceRequest.Status,
                        completedAt = inspection.MaintenanceRequest.CompletedDate
                    } : null
                }
            });
        }

        [HttpGet("my-inspections")]
        public async Task<ActionResult<IEnumerable<PreTripInspection>>> GetMyInspections()
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized();
            }

            var inspections = await _context.PreTripInspections
                .Include(i => i.Vehicle)
                .Include(i => i.Route)
                .Include(i => i.MaintenanceRequest)
                .Where(i => i.DriverId == driverId)
                .OrderByDescending(i => i.InspectionDate)
                .Take(50)
                .ToListAsync();

            return Ok(inspections);
        }

        private bool CheckAllItemsPassed(PreTripInspection inspection)
        {
            return inspection.EngineOilOk &&
                   inspection.CoolantOk &&
                   inspection.BatteryOk &&
                   inspection.BrakesOk &&
                   inspection.DashboardWarningLights &&
                   inspection.TirePressureOk &&
                   inspection.TireTreadOk &&
                   inspection.TireDamageCheck &&
                   inspection.WheelLugsOk &&
                   inspection.HeadlightsOk &&
                   inspection.BrakeLightsOk &&
                   inspection.TurnSignalsOk &&
                   inspection.HazardLightsOk &&
                   inspection.SeatbeltsOk &&
                   inspection.FireExtinguisherPresent &&
                   inspection.FirstAidKitPresent &&
                   inspection.WarningTrianglesPresent &&
                   inspection.MirrorsOk &&
                   inspection.WindshieldWipersOk &&
                   inspection.HornWorking &&
                   inspection.DoorsAndLocksOk;
        }

        private string GetFailedItems(PreTripInspection inspection)
        {
            var failedItems = new List<string>();

            if (!inspection.EngineOilOk) failedItems.Add("Engine Oil Level");
            if (!inspection.CoolantOk) failedItems.Add("Coolant Level");
            if (!inspection.BatteryOk) failedItems.Add("Battery Condition");
            if (!inspection.BrakesOk) failedItems.Add("Brake Fluid");
            if (!inspection.DashboardWarningLights) failedItems.Add("Dashboard Warning Lights");
            if (!inspection.TirePressureOk) failedItems.Add("Tire Pressure");
            if (!inspection.TireTreadOk) failedItems.Add("Tire Tread");
            if (!inspection.TireDamageCheck) failedItems.Add("Tire Damage");
            if (!inspection.WheelLugsOk) failedItems.Add("Wheel Lugs");
            if (!inspection.HeadlightsOk) failedItems.Add("Headlights");
            if (!inspection.BrakeLightsOk) failedItems.Add("Brake Lights");
            if (!inspection.TurnSignalsOk) failedItems.Add("Turn Signals");
            if (!inspection.HazardLightsOk) failedItems.Add("Hazard Lights");
            if (!inspection.SeatbeltsOk) failedItems.Add("Seatbelts");
            if (!inspection.FireExtinguisherPresent) failedItems.Add("Fire Extinguisher");
            if (!inspection.FirstAidKitPresent) failedItems.Add("First Aid Kit");
            if (!inspection.WarningTrianglesPresent) failedItems.Add("Warning Triangles");
            if (!inspection.MirrorsOk) failedItems.Add("Mirrors");
            if (!inspection.WindshieldWipersOk) failedItems.Add("Windshield Wipers");
            if (!inspection.HornWorking) failedItems.Add("Horn");
            if (!inspection.DoorsAndLocksOk) failedItems.Add("Doors and Locks");

            return System.Text.Json.JsonSerializer.Serialize(failedItems);
        }
    }
}
