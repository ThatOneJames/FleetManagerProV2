using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FleetManagerPro.API.Services;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.DTOs;

namespace FleetManagerPro.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly ILeaveRequestService _leaveRequestService;
        private readonly ILogger<LeaveRequestsController> _logger;

        public LeaveRequestsController(ILeaveRequestService leaveRequestService, ILogger<LeaveRequestsController> logger)
        {
            _leaveRequestService = leaveRequestService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLeaveRequests()
        {
            try
            {
                var leaveRequests = await _leaveRequestService.GetAllLeaveRequestsAsync();
                return Ok(leaveRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leave requests");
                return StatusCode(500, new { message = "Error retrieving leave requests" });
            }
        }

        [HttpGet("driver/{driverId}")]
        public async Task<IActionResult> GetLeaveRequestsByDriverId(string driverId)
        {
            try
            {
                var leaveRequests = await _leaveRequestService.GetLeaveRequestsByDriverIdAsync(driverId);
                return Ok(leaveRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leave requests for driver {DriverId}", driverId);
                return StatusCode(500, new { message = "Error retrieving leave requests" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLeaveRequestById(string id)
        {
            try
            {
                var leaveRequest = await _leaveRequestService.GetLeaveRequestByIdAsync(id);
                if (leaveRequest == null)
                {
                    return NotFound(new { message = "Leave request not found" });
                }
                return Ok(leaveRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leave request {Id}", id);
                return StatusCode(500, new { message = "Error retrieving leave request" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateLeaveRequest([FromBody] CreateLeaveRequestDto dto)
        {
            try
            {
                _logger.LogInformation("Received leave request data:");
                _logger.LogInformation("DriverId: {DriverId}", dto?.DriverId ?? "NULL");
                _logger.LogInformation("LeaveType: {LeaveType} (Raw value: {RawValue})", dto?.LeaveType, (int?)dto?.LeaveType);
                _logger.LogInformation("StartDate: {StartDate}", dto?.StartDate);
                _logger.LogInformation("EndDate: {EndDate}", dto?.EndDate);
                _logger.LogInformation("Reason: {Reason}", dto?.Reason ?? "NULL");
                _logger.LogInformation("Reason Length: {Length}", dto?.Reason?.Length ?? 0);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Model validation failed:");
                    foreach (var error in ModelState)
                    {
                        _logger.LogWarning("Field: {Field}, Errors: {Errors}",
                            error.Key,
                            string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage)));
                    }
                    return BadRequest(ModelState);
                }

                var leaveRequest = await _leaveRequestService.CreateLeaveRequestAsync(dto);
                return CreatedAtAction(nameof(GetLeaveRequestById), new { id = leaveRequest.Id }, leaveRequest);
            }
            catch (ArgumentException ex)
            {
                _logger.LogError("ArgumentException: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError("InvalidOperationException: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating leave request");
                return StatusCode(500, new { message = "Error creating leave request" });
            }
        }

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> ApproveLeaveRequest(string id, [FromBody] ApproveLeaveRequestDto dto)
        {
            try
            {
                var leaveRequest = await _leaveRequestService.ApproveLeaveRequestAsync(id, dto.ApprovedBy, dto.Notes);
                if (leaveRequest == null)
                {
                    return NotFound(new { message = "Leave request not found" });
                }
                return Ok(leaveRequest);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving leave request {Id}", id);
                return StatusCode(500, new { message = "Error approving leave request" });
            }
        }

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> RejectLeaveRequest(string id, [FromBody] RejectLeaveRequestDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.RejectionReason))
                {
                    return BadRequest(new { message = "Rejection reason is required" });
                }

                var leaveRequest = await _leaveRequestService.RejectLeaveRequestAsync(id, dto.RejectedBy, dto.RejectionReason);
                if (leaveRequest == null)
                {
                    return NotFound(new { message = "Leave request not found" });
                }
                return Ok(leaveRequest);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting leave request {Id}", id);
                return StatusCode(500, new { message = "Error rejecting leave request" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeaveRequest(string id)
        {
            try
            {
                var success = await _leaveRequestService.DeleteLeaveRequestAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Leave request not found" });
                }
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting leave request {Id}", id);
                return StatusCode(500, new { message = "Error deleting leave request" });
            }
        }

        [HttpGet("balance/{driverId}")]
        public async Task<IActionResult> GetLeaveBalance(string driverId)
        {
            try
            {
                var balance = await _leaveRequestService.GetLeaveBalanceAsync(driverId);
                return Ok(balance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leave balance for driver {DriverId}", driverId);
                return StatusCode(500, new { message = "Error retrieving leave balance" });
            }
        }

        [HttpGet("types")]
        public async Task<IActionResult> GetLeaveTypes()
        {
            try
            {
                var leaveTypes = await _leaveRequestService.GetLeaveTypesAsync();
                return Ok(leaveTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leave types");
                return StatusCode(500, new { message = "Error retrieving leave types" });
            }
        }
    }
}