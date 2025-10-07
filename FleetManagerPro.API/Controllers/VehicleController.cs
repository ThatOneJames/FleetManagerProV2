using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Collections.Generic;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Services;
using System.Threading.Tasks;
using FleetManagerPro.API.DTOs.Vehicles;

namespace FleetManager.Controllers
{
    [ApiController]
    [Route("api/vehicles")]
    public class VehicleController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;
        private readonly VehicleService _vehicleService;

        public VehicleController(FleetManagerDbContext context, VehicleService vehicleService)
        {
            _context = context;
            _vehicleService = vehicleService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetAll()
        {
            var vehicles = await _vehicleService.GetAllAsync();
            return Ok(vehicles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetById(string id)
        {
            var vehicle = await _vehicleService.GetByIdAsync(id);
            if (vehicle == null)
            {
                return NotFound();
            }
            return Ok(vehicle);
        }

        [HttpPost]
        public async Task<ActionResult<Vehicle>> Create([FromBody] CreateVehicleDto vehicleDto)
        {
            // VehicleService handles auto-increment VEH- ID generation
            var createdVehicle = await _vehicleService.CreateAsync(vehicleDto);
            return CreatedAtAction(nameof(GetById), new { id = createdVehicle.Id }, createdVehicle);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Vehicle>> Update(string id, [FromBody] Vehicle vehicle)
        {
            var updatedVehicle = await _vehicleService.UpdateAsync(id, vehicle);
            if (updatedVehicle == null)
            {
                return NotFound();
            }
            return Ok(updatedVehicle);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var deleted = await _vehicleService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
