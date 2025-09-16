using FleetManagerPro.API.Models;
using FleetManagerPro.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehicleCntroller : ControllerBase
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
        public async Task<ActionResult<Vehicle>> GetById(int id)
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
        public async Task<ActionResult<Vehicle>> Update(int id, Vehicle vehicle)
        {
            var updated = await _vehicleService.UpdateAsync(id, vehicle);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var deleted = await _vehicleService.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
