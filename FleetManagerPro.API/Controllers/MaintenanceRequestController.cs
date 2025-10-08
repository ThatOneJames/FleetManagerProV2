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
    public class MaintenanceRequestController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;

        public MaintenanceRequestController(FleetManagerDbContext context)
        {
            _context = context;
        }

        // POST: api/maintenancerequest
        [HttpPost]
        public async Task<ActionResult<MaintenanceRequest>> CreateMaintenanceRequest([FromBody] CreateMaintenanceRequestDto dto)
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized("Driver not authenticated");
            }

            // ✅ FIXED: No Guid.Parse - driverId is already a string
            var assignedRoute = await _context.Routes
                .FirstOrDefaultAsync(r => r.DriverId == driverId &&
                                         r.VehicleId == dto.VehicleId &&
                                         (r.Status == "planned" || r.Status == "in_progress"));

            if (assignedRoute == null)
            {
                return BadRequest("You can only submit maintenance requests for vehicles assigned to you on active routes.");
            }

            // Validate vehicle exists
            var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId);
            if (vehicle == null)
            {
                return NotFound("Vehicle not found");
            }

            // ✅ FIXED: No Guid.Parse - use driverId directly
            var driver = await _context.Users.FindAsync(driverId);
            if (driver == null)
            {
                return NotFound("Driver not found");
            }

            // Create maintenance request
            var maintenanceRequest = new MaintenanceRequest
            {
                Id = Guid.NewGuid().ToString(),
                VehicleId = dto.VehicleId,
                DriverId = driverId, // ✅ FIXED: Direct assignment
                RouteId = dto.RouteId,
                InspectionId = dto.InspectionId,
                IssueType = dto.IssueType,
                IssueSeverity = dto.IssueSeverity,
                Description = dto.Description,
                ReportedBy = driver.Name,
                Status = "Pending",
                Priority = dto.Priority,
                ReportedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.MaintenanceRequests.Add(maintenanceRequest);

            // If linked to inspection, update inspection record
            if (!string.IsNullOrEmpty(dto.InspectionId))
            {
                var inspection = await _context.PreTripInspections.FindAsync(dto.InspectionId);
                if (inspection != null)
                {
                    inspection.MaintenanceRequestId = maintenanceRequest.Id;
                    inspection.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaintenanceRequestById), new { id = maintenanceRequest.Id }, maintenanceRequest);
        }

        // GET: api/maintenancerequest/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRequest>> GetMaintenanceRequestById(string id)
        {
            var request = await _context.MaintenanceRequests
                .Include(m => m.Vehicle)
                .Include(m => m.Driver)
                .Include(m => m.Route)
                .Include(m => m.Inspection)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (request == null)
            {
                return NotFound();
            }

            return Ok(request);
        }

        // GET: api/maintenancerequest/my-requests
        [HttpGet("my-requests")]
        public async Task<ActionResult<IEnumerable<MaintenanceRequest>>> GetMyRequests()
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized();
            }

            // ✅ FIXED: No Guid.Parse - compare strings directly
            var requests = await _context.MaintenanceRequests
                .Include(m => m.Vehicle)
                .Include(m => m.Route)
                .Where(m => m.DriverId == driverId)
                .OrderByDescending(m => m.ReportedDate)
                .ToListAsync();

            return Ok(requests);
        }

        // GET: api/maintenancerequest (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<MaintenanceRequest>>> GetAllRequests()
        {
            var requests = await _context.MaintenanceRequests
                .Include(m => m.Vehicle)
                .Include(m => m.Driver)
                .Include(m => m.Route)
                .OrderByDescending(m => m.ReportedDate)
                .ToListAsync();

            return Ok(requests);
        }

        // PUT: api/maintenancerequest/{id}/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRequestStatus(string id, [FromBody] UpdateMaintenanceStatusDto dto)
        {
            var request = await _context.MaintenanceRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            request.Status = dto.Status;
            request.AssignedMechanic = dto.AssignedMechanic;
            request.RepairNotes = dto.RepairNotes;
            request.UpdatedAt = DateTime.UtcNow;

            if (dto.Status == "Completed")
            {
                request.CompletedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/maintenancerequest/check-vehicle/{vehicleId}
        [HttpGet("check-vehicle/{vehicleId}")]
        public async Task<ActionResult<object>> CheckVehicleAssignment(string vehicleId) // ✅ FIXED: Changed to string
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized();
            }

            // ✅ FIXED: All string comparisons - no Guid.Parse
            var hasAssignment = await _context.Routes
                .AnyAsync(r => r.DriverId == driverId &&
                              r.VehicleId == vehicleId &&
                              (r.Status == "planned" || r.Status == "in_progress"));

            return Ok(new { hasAssignment, vehicleId });
        }
    }
}
