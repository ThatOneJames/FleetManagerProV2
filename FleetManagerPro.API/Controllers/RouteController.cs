using FleetManagerPro.API.DTOs;
using FleetManagerPro.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FleetManagerPro.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RoutesController : ControllerBase
    {
        private readonly IRouteService _routeService;
        private readonly ILogger<RoutesController> _logger;

        public RoutesController(IRouteService routeService, ILogger<RoutesController> logger)
        {
            _routeService = routeService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RouteDto>>> GetAllRoutes()
        {
            try
            {
                var routes = await _routeService.GetAllRoutesAsync();
                return Ok(routes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all routes");
                return StatusCode(500, "An error occurred while retrieving routes");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RouteDto>> GetRouteById(string id)
        {
            try
            {
                var route = await _routeService.GetRouteByIdAsync(id);
                if (route == null)
                    return NotFound($"Route with ID {id} not found");

                return Ok(route);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving route {RouteId}", id);
                return StatusCode(500, "An error occurred while retrieving the route");
            }
        }

        [HttpGet("vehicle/{vehicleId}")]
        public async Task<ActionResult<IEnumerable<RouteDto>>> GetRoutesByVehicle(string vehicleId)
        {
            try
            {
                var routes = await _routeService.GetRoutesByVehicleAsync(vehicleId);
                return Ok(routes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving routes for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, "An error occurred while retrieving routes");
            }
        }

        [HttpGet("driver/{driverId}")]
        public async Task<ActionResult<IEnumerable<RouteDto>>> GetRoutesByDriver(string driverId)
        {
            try
            {
                var routes = await _routeService.GetRoutesByDriverAsync(driverId);
                return Ok(routes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving routes for driver {DriverId}", driverId);
                return StatusCode(500, "An error occurred while retrieving routes");
            }
        }

        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<RouteDto>>> GetRoutesByStatus(string status)
        {
            try
            {
                var routes = await _routeService.GetRoutesByStatusAsync(status);
                return Ok(routes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving routes with status {Status}", status);
                return StatusCode(500, "An error occurred while retrieving routes");
            }
        }

        [HttpPost]
        public async Task<ActionResult<RouteDto>> CreateRoute([FromBody] CreateRouteDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var route = await _routeService.CreateRouteAsync(createDto, userId);

                return CreatedAtAction(nameof(GetRouteById), new { id = route.Id }, route);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating route");
                return StatusCode(500, "An error occurred while creating the route");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<RouteDto>> UpdateRoute(string id, [FromBody] UpdateRouteDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var route = await _routeService.UpdateRouteAsync(id, updateDto);
                return Ok(route);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating route {RouteId}", id);
                return StatusCode(500, "An error occurred while updating the route");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRoute(string id)
        {
            try
            {
                var result = await _routeService.DeleteRouteAsync(id);
                if (!result)
                    return NotFound($"Route with ID {id} not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting route {RouteId}", id);
                return StatusCode(500, "An error occurred while deleting the route");
            }
        }

        [HttpPatch("stops/{stopId}/status")]
        public async Task<ActionResult<RouteStopDto>> UpdateStopStatus(string stopId, [FromBody] UpdateRouteStopStatusDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var stop = await _routeService.UpdateRouteStopStatusAsync(stopId, updateDto);
                return Ok(stop);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stop status {StopId}", stopId);
                return StatusCode(500, "An error occurred while updating the stop status");
            }
        }

        [HttpPost("{id}/optimize")]
        public async Task<ActionResult<RouteDto>> OptimizeRoute(string id)
        {
            try
            {
                var route = await _routeService.OptimizeRouteAsync(id);
                return Ok(route);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing route {RouteId}", id);
                return StatusCode(500, "An error occurred while optimizing the route");
            }
        }
    }
}