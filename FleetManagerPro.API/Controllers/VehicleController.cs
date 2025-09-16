using FleetManagerPro.API.Models;
using FleetManagerPro.API.Services;
using Microsoft.AspNetCore.Mvc;
using FleetManagerPro.API.Data;
using System; // Required for Guid
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehicleController : ControllerBase
    {
        private readonly VehicleService _vehicleService;

        public VehicleController(VehicleService vehicleService)
        {
            _vehicleService = vehicleService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetAll()
        {
            var vehicles = await _vehicleService.GetAllAsync();
            return Ok(vehicles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetById(Guid id) // Changed 'int' to 'Guid'
        {
            var vehicle = await _vehicleService.GetByIdAsync(id);
            if (vehicle == null) return NotFound();
            return Ok(vehicle);
        }

        [HttpPost]
        public async Task<ActionResult<Vehicle>> Create(Vehicle vehicle)
        {
            var created = await _vehicleService.CreateAsync(vehicle);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Vehicle>> Update(Guid id, Vehicle vehicle) // Changed 'int' to 'Guid'
        {
            var updated = await _vehicleService.UpdateAsync(id, vehicle);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id) // Changed 'int' to 'Guid'
        {
            var deleted = await _vehicleService.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}