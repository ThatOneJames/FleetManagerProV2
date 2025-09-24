using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Services;
using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Data;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DriverController : ControllerBase
    {
        private readonly IDriverService _driverService;
        private readonly IUserRepository _userRepository;
        private readonly FleetManagerDbContext _context;

        public DriverController(IDriverService driverService, IUserRepository userRepository, FleetManagerDbContext context)
        {
            _driverService = driverService;
            _userRepository = userRepository;
            _context = context;
        }

        // GET: api/drivers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAllDrivers()
        {
            var drivers = await _userRepository.GetAllDriversWithUserAsync();
            return Ok(drivers);
        }

        // GET: api/drivers/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Driver>> GetDriverById(string id)
        {
            var driver = await _context.Drivers.FindAsync(id);
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
        public async Task<IActionResult> UpdateDriver(string id, Driver driver)
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
        public async Task<IActionResult> DeleteDriver(string id)
        {
            var success = await _driverService.DeleteAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}
