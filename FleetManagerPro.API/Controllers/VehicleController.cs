using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Security.Claims;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Services;
using System.Threading.Tasks;
using FleetManagerPro.API.DTOs.Vehicles;

namespace FleetManager.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/vehicles")]
    public class VehicleController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;
        private readonly VehicleService _vehicleService;
        private readonly IAuditService _auditService;
        private readonly ILogger<VehicleController> _logger;

        public VehicleController(
            FleetManagerDbContext context,
            VehicleService vehicleService,
            IAuditService auditService,
            ILogger<VehicleController> logger)
        {
            _context = context;
            _vehicleService = vehicleService;
            _auditService = auditService;
            _logger = logger;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetAll()
        {
            try
            {
                var vehicles = await _vehicleService.GetAllAsync();
                return Ok(vehicles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all vehicles");
                return StatusCode(500, new { message = "Error retrieving vehicles", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetById(string id)
        {
            try
            {
                var vehicle = await _vehicleService.GetByIdAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new { message = "Vehicle not found" });
                }
                return Ok(vehicle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle {Id}", id);
                return StatusCode(500, new { message = "Error retrieving vehicle", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Vehicle>> Create([FromBody] CreateVehicleDto vehicleDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // VehicleService handles auto-increment VEH- ID generation
                var createdVehicle = await _vehicleService.CreateAsync(vehicleDto);

                // ✅ AUDIT LOG - CREATE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "CREATE",
                    "Vehicle",
                    createdVehicle.Id,
                    $"Created vehicle: {vehicleDto.Make} {vehicleDto.Model} ({vehicleDto.LicensePlate})",
                    null,
                    new
                    {
                        createdVehicle.Make,
                        createdVehicle.Model,
                        createdVehicle.LicensePlate,
                        createdVehicle.Status
                    }
                );

                return CreatedAtAction(nameof(GetById), new { id = createdVehicle.Id }, createdVehicle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vehicle");
                return StatusCode(500, new { message = "Error creating vehicle", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Vehicle>> Update(string id, [FromBody] Vehicle vehicle)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var existingVehicle = await _vehicleService.GetByIdAsync(id);
                if (existingVehicle == null)
                {
                    return NotFound(new { message = "Vehicle not found" });
                }

                // Capture old values
                var oldValue = new
                {
                    existingVehicle.Make,
                    existingVehicle.Model,
                    existingVehicle.Status,
                    existingVehicle.LicensePlate
                };

                var updatedVehicle = await _vehicleService.UpdateAsync(id, vehicle);
                if (updatedVehicle == null)
                {
                    return NotFound(new { message = "Vehicle not found" });
                }

                // ✅ AUDIT LOG - UPDATE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "UPDATE",
                    "Vehicle",
                    id,
                    $"Updated vehicle: {vehicle.Make} {vehicle.Model} - Status: {oldValue.Status} → {vehicle.Status}",
                    oldValue,
                    new
                    {
                        updatedVehicle.Make,
                        updatedVehicle.Model,
                        updatedVehicle.Status,
                        updatedVehicle.LicensePlate
                    }
                );

                return Ok(updatedVehicle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicle {Id}", id);
                return StatusCode(500, new { message = "Error updating vehicle", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                var vehicleToDelete = await _vehicleService.GetByIdAsync(id);
                if (vehicleToDelete == null)
                {
                    return NotFound(new { message = "Vehicle not found" });
                }

                var deleted = await _vehicleService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { message = "Vehicle not found" });
                }

                // ✅ AUDIT LOG - DELETE
                await _auditService.LogActionAsync(
                    GetUserId(),
                    "DELETE",
                    "Vehicle",
                    id,
                    $"Deleted vehicle: {vehicleToDelete.Make} {vehicleToDelete.Model} ({vehicleToDelete.LicensePlate})",
                    new
                    {
                        vehicleToDelete.Make,
                        vehicleToDelete.Model,
                        vehicleToDelete.Status,
                        vehicleToDelete.LicensePlate
                    },
                    null
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting vehicle {Id}", id);
                return StatusCode(500, new { message = "Error deleting vehicle", error = ex.Message });
            }
        }
    }
}
