using Microsoft.AspNetCore.Mvc;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Services;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaintenanceController : ControllerBase
    {
        private readonly MaintenanceService _maintenanceService;

        public MaintenanceController(MaintenanceService maintenanceService)
        {
            _maintenanceService = maintenanceService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceRecord>>> GetAll()
        {
            var records = await _maintenanceService.GetAllAsync();
            return Ok(records);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceRecord>> GetById(string id) // Changed 'int' to 'string'
        {
            var record = await _maintenanceService.GetByIdAsync(id);
            if (record == null) return NotFound();
            return Ok(record);
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceRecord>> Create(MaintenanceRecord record)
        {
            var created = await _maintenanceService.CreateAsync(record);
            // The route parameter 'id' will be a string, which is correct
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<MaintenanceRecord>> Update(string id, MaintenanceRecord record) // Changed 'int' to 'string'
        {
            var updated = await _maintenanceService.UpdateAsync(id, record);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id) // Changed 'int' to 'string'
        {
            var deleted = await _maintenanceService.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}