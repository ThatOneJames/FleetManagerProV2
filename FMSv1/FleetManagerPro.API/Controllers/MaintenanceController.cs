using FleetManagerPro.API.Models;
using FleetManagerPro.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaintenanceController : ControllerBase
    {
        private readonly MaintenanceRecordService _maintenanceService;

        public MaintenanceController(MaintenanceRecordService maintenanceService)
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
        public async Task<ActionResult<MaintenanceRecord>> GetById(int id)
        {
            var record = await _maintenanceService.GetByIdAsync(id);
            if (record == null) return NotFound();
            return Ok(record);
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceRecord>> Create(MaintenanceRecord record)
        {
            var created = await _maintenanceService.CreateAsync(record);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<MaintenanceRecord>> Update(int id, MaintenanceRecord record)
        {
            var updated = await _maintenanceService.UpdateAsync(id, record);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var deleted = await _maintenanceService.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
