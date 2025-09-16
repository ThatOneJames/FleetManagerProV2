using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using fleet_manager_backend.Models;  // adjust namespace
using fleet_manager_backend.Services; // adjust namespace

namespace fleet_manager_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DriverController : ControllerBase
    {
        private readonly DriverService _driverService;

        public DriversController(DriverService driverService)
        {
            _driverService = driverService;
        }

        // GET: api/drivers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Driver>>> GetAllDrivers()
        {
            var drivers = await _driverService.GetAllAsync();
            return Ok(drivers);
        }

        // GET: api/drivers/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Driver>> GetDriverById(int id)
        {
            var driver = await _driverService.GetByIdAsync(id);
            if (driver == null)
                return NotFound();

            return Ok(driver);
        }

        // POST: api/drivers
        [HttpPost]
        public async Task<ActionResult<Driver>> CreateDriver(Driver driver)
        {
            var created = await _driverService.CreateAsync(driver);
            return CreatedAtAction(nameof(GetDriverById), new { id = created.Id }, created);
        }

        // PUT: api/drivers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDriver(int id, Driver driver)
        {
            if (id != driver.Id)
                return BadRequest();

            var success = await _driverService.UpdateAsync(driver);
            if (!success)
                return NotFound();

            return NoContent();
        }

        // DELETE: api/drivers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            var success = await _driverService.DeleteAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}
