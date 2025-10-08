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

        public PreTripInspectionController(FleetManagerDbContext context)
        {
            _context = context;
        }

        // POST: api/pretripinspection
        [HttpPost]
        public async Task<ActionResult<PreTripInspection>> CreateInspection([FromBody] CreatePreTripInspectionDto dto)
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized("Driver not authenticated");
            }

            // Validate route exists
            var route = await _context.Routes.FindAsync(dto.RouteId);
            if (route == null)
            {
                return NotFound("Route not found");
            }

            // Validate vehicle exists
            var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId);
            if (vehicle == null)
            {
                return NotFound("Vehicle not found");
            }

            // ✅ FIXED: Check if inspection already exists for this route (string comparison)
            var existingInspection = await _context.PreTripInspections
                .FirstOrDefaultAsync(i => i.RouteId == dto.RouteId && i.DriverId == driverId);

            if (existingInspection != null)
            {
                return BadRequest("Pre-trip inspection already completed for this route");
            }

            // Create inspection
            var inspection = new PreTripInspection
            {
                Id = Guid.NewGuid().ToString(),
                RouteId = dto.RouteId,
                VehicleId = dto.VehicleId,
                DriverId = driverId, // ✅ FIXED: Direct assignment (no Guid.Parse)
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

            // Check if all items passed
            inspection.AllItemsPassed = CheckAllItemsPassed(inspection);

            // If any items failed, collect them
            if (!inspection.AllItemsPassed)
            {
                inspection.IssuesFound = GetFailedItems(inspection);
            }

            _context.PreTripInspections.Add(inspection);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInspectionById), new { id = inspection.Id }, inspection);
        }

        // GET: api/pretripinspection/{id}
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

        // GET: api/pretripinspection/route/{routeId}
        [HttpGet("route/{routeId}")]
        public async Task<ActionResult<PreTripInspection>> GetInspectionByRoute(string routeId)
        {
            var inspection = await _context.PreTripInspections
                .Include(i => i.Vehicle)
                .Include(i => i.Driver)
                .Include(i => i.MaintenanceRequest)
                .FirstOrDefaultAsync(i => i.RouteId == routeId);

            if (inspection == null)
            {
                return NotFound("No inspection found for this route");
            }

            return Ok(inspection);
        }

        // GET: api/pretripinspection/my-inspections
        [HttpGet("my-inspections")]
        public async Task<ActionResult<IEnumerable<PreTripInspection>>> GetMyInspections()
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized();
            }

            // ✅ FIXED: String comparison (no Guid.Parse)
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

        // Helper method to check if all items passed
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

        // Helper method to get failed items as JSON
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
