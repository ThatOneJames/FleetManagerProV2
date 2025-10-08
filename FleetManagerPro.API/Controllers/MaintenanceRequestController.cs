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
                DriverId = driverId,
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
            try
            {
                var request = await _context.MaintenanceRequests
                    .Include(m => m.Vehicle)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (request == null)
                {
                    return NotFound(new { message = "Maintenance request not found" });
                }

                // Update request status
                request.Status = dto.Status;
                request.AssignedMechanic = dto.AssignedMechanic;
                request.RepairNotes = dto.RepairNotes;
                request.UpdatedAt = DateTime.UtcNow;

                // ✅ NEW: Auto-update vehicle status based on maintenance request status
                if (request.Vehicle != null)
                {
                    switch (dto.Status)
                    {
                        case "InProgress":
                            request.Vehicle.Status = "Maintenance";
                            Console.WriteLine($"[INFO] Vehicle {request.VehicleId} marked as Maintenance");
                            break;

                        case "Completed":
                            request.Vehicle.Status = "Ready";
                            request.CompletedDate = DateTime.UtcNow;
                            Console.WriteLine($"[INFO] Vehicle {request.VehicleId} marked as Ready");
                            break;

                        case "Cancelled":
                            request.Vehicle.Status = "Ready";
                            Console.WriteLine($"[INFO] Vehicle {request.VehicleId} marked as Ready (request cancelled)");
                            break;
                    }

                    request.Vehicle.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Maintenance request status updated successfully",
                    requestStatus = request.Status,
                    vehicleStatus = request.Vehicle?.Status
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] UpdateRequestStatus: {ex.Message}");
                return StatusCode(500, new { message = "Error updating maintenance request status", error = ex.Message });
            }
        }

        // GET: api/maintenancerequest/check-vehicle/{vehicleId}
        [HttpGet("check-vehicle/{vehicleId}")]
        public async Task<ActionResult<object>> CheckVehicleAssignment(string vehicleId)
        {
            var driverId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(driverId))
            {
                return Unauthorized();
            }

            var hasAssignment = await _context.Routes
                .AnyAsync(r => r.DriverId == driverId &&
                              r.VehicleId == vehicleId &&
                              (r.Status == "planned" || r.Status == "in_progress"));

            return Ok(new { hasAssignment, vehicleId });
        }
    }
}
