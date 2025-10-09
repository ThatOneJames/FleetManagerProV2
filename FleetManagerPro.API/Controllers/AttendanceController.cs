using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.DTOs;
using FleetManagerPro.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace FleetManagerPro.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceRepository _attendanceRepository;
        private readonly IUserRepository _userRepository;

        public AttendanceController(IAttendanceRepository attendanceRepository, IUserRepository userRepository)
        {
            _attendanceRepository = attendanceRepository;
            _userRepository = userRepository;
        }

        // Debug endpoint to see what claims are in the token
        [HttpGet("debug/claims")]
        public IActionResult DebugClaims()
        {
            try
            {
                var claims = User.Claims.Select(c => new {
                    Type = c.Type,
                    Value = c.Value
                }).ToList();

                var userId = GetCurrentUserId();
                var userName = GetCurrentUserName();

                return Ok(new
                {
                    message = "Claims from JWT token",
                    claims = claims,
                    extractedUserId = userId,
                    extractedUserName = userName,
                    isAuthenticated = User.Identity?.IsAuthenticated ?? false,
                    authType = User.Identity?.AuthenticationType
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] DebugClaims failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AttendanceResponseDto>>> GetAllAttendance()
        {
            try
            {
                var records = await _attendanceRepository.GetAllAsync();
                var responseDtos = records.Select(MapToResponseDto);
                return Ok(responseDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetAllAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AttendanceResponseDto>> GetAttendance(long id)
        {
            try
            {
                var record = await _attendanceRepository.GetByIdAsync(id);
                if (record == null)
                    return NotFound(new { message = "Attendance record not found" });

                return Ok(MapToResponseDto(record));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance/driver/{driverId}/today
        [HttpGet("driver/{driverId}/today")]
        public async Task<ActionResult<AttendanceResponseDto>> GetTodayAttendance(string driverId)
        {
            try
            {
                var record = await _attendanceRepository.GetTodayAttendanceAsync(driverId);
                if (record == null)
                    return NotFound(new { message = "No attendance record found for today" });

                return Ok(MapToResponseDto(record));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetTodayAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance/my/today
        [HttpGet("my/today")]
        public async Task<ActionResult> GetMyTodayAttendance()
        {
            try
            {
                // Try multiple claim types to find the user ID
                var userId = GetCurrentUserId();
                var userName = GetCurrentUserName();

                Console.WriteLine($"[DEBUG] GetMyTodayAttendance - UserId: {userId}, UserName: {userName}");
                Console.WriteLine($"[DEBUG] All Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");

                if (userId == null)
                {
                    Console.WriteLine("[DEBUG] Unauthorized - No user ID found in claims");
                    return Unauthorized(new { message = "No user ID found in token" });
                }

                var record = await _attendanceRepository.GetTodayAttendanceAsync(userId);
                Console.WriteLine($"[DEBUG] Today's attendance record: {(record != null ? "Found" : "Not found")}");

                if (record == null)
                    return Ok(new { message = "No attendance record for today", data = (object?)null });

                return Ok(new { message = "Today's attendance", data = MapToResponseDto(record) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetMyTodayAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance/driver/{driverId}/range?startDate=2025-01-01&endDate=2025-01-31
        [HttpGet("driver/{driverId}/range")]
        public async Task<ActionResult<IEnumerable<AttendanceResponseDto>>> GetDriverAttendanceByRange(
            string driverId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                Console.WriteLine($"[DEBUG] GetDriverAttendanceByRange - DriverId: {driverId}, StartDate: {startDate}, EndDate: {endDate}");

                var records = await _attendanceRepository.GetByDateRangeAsync(driverId, startDate, endDate);
                var responseDtos = records.Select(MapToResponseDto);

                Console.WriteLine($"[DEBUG] Found {records.Count()} attendance records for date range");
                return Ok(responseDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetDriverAttendanceByRange failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance/driver/{driverId}/week?weekStart=2025-01-01
        [HttpGet("driver/{driverId}/week")]
        public async Task<ActionResult<WeeklyAttendanceDto>> GetWeeklyAttendance(
            string driverId,
            [FromQuery] DateTime weekStart)
        {
            try
            {
                Console.WriteLine($"[DEBUG] GetWeeklyAttendance - DriverId: {driverId}, WeekStart: {weekStart}");

                var records = await _attendanceRepository.GetWeeklyAttendanceAsync(driverId, weekStart);
                var stats = await _attendanceRepository.GetAttendanceStatsAsync(driverId, weekStart, weekStart.AddDays(6));

                var weeklyDto = new WeeklyAttendanceDto
                {
                    WeekStart = weekStart,
                    WeekEnd = weekStart.AddDays(6),
                    Records = records.Select(MapToResponseDto).ToList(),
                    Stats = MapToStatsDto(stats)
                };

                return Ok(weeklyDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetWeeklyAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance/my/week?weekStart=2025-01-01
        [HttpGet("my/week")]
        public async Task<ActionResult<WeeklyAttendanceDto>> GetMyWeeklyAttendance([FromQuery] DateTime weekStart)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"[DEBUG] GetMyWeeklyAttendance - UserId: {userId}, WeekStart: {weekStart}");
                Console.WriteLine($"[DEBUG] All Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");

                if (userId == null)
                {
                    Console.WriteLine("[DEBUG] Unauthorized - No user ID found in claims");
                    return Unauthorized(new { message = "No user ID found in token" });
                }

                return await GetWeeklyAttendance(userId, weekStart);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetMyWeeklyAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/attendance/driver/{driverId}/stats?startDate=2025-01-01&endDate=2025-01-31
        [HttpGet("driver/{driverId}/stats")]
        public async Task<ActionResult<AttendanceStatsDto>> GetAttendanceStats(
            string driverId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var stats = await _attendanceRepository.GetAttendanceStatsAsync(driverId, startDate, endDate);
                var statsDto = MapToStatsDto(stats);
                return Ok(statsDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetAttendanceStats failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/attendance/clock-in
        [HttpPost("clock-in")]
        public async Task<IActionResult> ClockIn([FromBody] ClockInOutDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                var driverId = string.IsNullOrEmpty(dto.DriverId) ? currentUserId : dto.DriverId;

                Console.WriteLine($"[DEBUG] ClockIn - UserId: {currentUserId}, DriverId: {driverId}");
                Console.WriteLine($"[DEBUG] All Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");

                if (driverId == null)
                    return Unauthorized(new { message = "No user ID found in token" });

                // Check if user exists and is a driver
                var user = await _userRepository.GetByIdAsync(driverId);
                if (user == null)
                    return NotFound(new { message = "Driver not found" });

                if (user.Role != "Driver")
                    return BadRequest(new { message = "User is not a driver" });

                // Check if already clocked in today
                var todayRecord = await _attendanceRepository.GetTodayAttendanceAsync(driverId);
                if (todayRecord?.ClockIn != null)
                    return BadRequest(new { message = "Already clocked in today" });

                var success = await _attendanceRepository.ClockInAsync(driverId, DateTime.Now, dto.Location, dto.Notes);
                if (!success)
                    return BadRequest(new { message = "Failed to clock in" });

                var updatedRecord = await _attendanceRepository.GetTodayAttendanceAsync(driverId);
                Console.WriteLine($"[DEBUG] Clock in successful for driver {driverId}");

                return Ok(new
                {
                    message = "Clocked in successfully",
                    data = updatedRecord != null ? MapToResponseDto(updatedRecord) : null
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] ClockIn failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/attendance/clock-out
        [HttpPost("clock-out")]
        public async Task<IActionResult> ClockOut([FromBody] ClockInOutDto dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var driverId = string.IsNullOrEmpty(dto.DriverId) ? currentUserId : dto.DriverId;

                Console.WriteLine($"[DEBUG] ClockOut - UserId: {currentUserId}, DriverId: {driverId}");
                Console.WriteLine($"[DEBUG] All Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");

                if (driverId == null)
                    return Unauthorized(new { message = "No user ID found in token" });

                // Check if clocked in today
                var todayRecord = await _attendanceRepository.GetTodayAttendanceAsync(driverId);
                if (todayRecord?.ClockIn == null)
                    return BadRequest(new { message = "Not clocked in today" });

                if (todayRecord.ClockOut != null)
                    return BadRequest(new { message = "Already clocked out today" });

                var success = await _attendanceRepository.ClockOutAsync(driverId, DateTime.Now);
                if (!success)
                    return BadRequest(new { message = "Failed to clock out" });

                var updatedRecord = await _attendanceRepository.GetTodayAttendanceAsync(driverId);
                Console.WriteLine($"[DEBUG] Clock out successful for driver {driverId}");

                return Ok(new
                {
                    message = "Clocked out successfully",
                    data = updatedRecord != null ? MapToResponseDto(updatedRecord) : null
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] ClockOut failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/attendance
        [HttpPost]
        public async Task<ActionResult<AttendanceResponseDto>> CreateAttendance([FromBody] CreateAttendanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Validate driver exists
                var driver = await _userRepository.GetByIdAsync(dto.DriverId);
                if (driver == null)
                    return NotFound(new { message = "Driver not found" });

                // Check if record already exists for this date
                var existingRecord = await _attendanceRepository.GetByDriverAndDateAsync(dto.DriverId, dto.Date);
                if (existingRecord != null)
                    return BadRequest(new { message = "Attendance record already exists for this date" });

                var attendance = new DriverAttendance
                {
                    DriverId = dto.DriverId,
                    Date = dto.Date.Date,
                    ClockIn = string.IsNullOrEmpty(dto.ClockIn) ? null : TimeSpan.Parse(dto.ClockIn),
                    ClockOut = string.IsNullOrEmpty(dto.ClockOut) ? null : TimeSpan.Parse(dto.ClockOut),
                    Status = dto.Status,
                    Location = dto.Location,
                    Notes = dto.Notes,
                    BreakDuration = dto.BreakDuration ?? 0
                };

                // Calculate total hours if both clock in and out are provided
                if (attendance.ClockIn.HasValue && attendance.ClockOut.HasValue)
                {
                    var totalMinutes = (attendance.ClockOut.Value - attendance.ClockIn.Value).TotalMinutes;
                    totalMinutes -= (double)(attendance.BreakDuration * 60);
                    attendance.TotalHours = (decimal)(totalMinutes / 60);

                    if (attendance.TotalHours > 8)
                    {
                        attendance.OvertimeHours = attendance.TotalHours.Value - 8;
                    }
                }

                var createdRecord = await _attendanceRepository.CreateAsync(attendance);
                return CreatedAtAction(nameof(GetAttendance), new { id = createdRecord.Id }, MapToResponseDto(createdRecord));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] CreateAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/attendance/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttendance(long id, [FromBody] UpdateAttendanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var record = await _attendanceRepository.GetByIdAsync(id);
                if (record == null)
                    return NotFound(new { message = "Attendance record not found" });

                // Update fields
                if (!string.IsNullOrEmpty(dto.ClockIn))
                    record.ClockIn = TimeSpan.Parse(dto.ClockIn);

                if (!string.IsNullOrEmpty(dto.ClockOut))
                    record.ClockOut = TimeSpan.Parse(dto.ClockOut);

                if (!string.IsNullOrEmpty(dto.Status))
                    record.Status = dto.Status;

                if (!string.IsNullOrEmpty(dto.Location))
                    record.Location = dto.Location;

                if (!string.IsNullOrEmpty(dto.Notes))
                    record.Notes = dto.Notes;

                if (dto.BreakDuration.HasValue)
                    record.BreakDuration = dto.BreakDuration.Value;

                // Recalculate total hours if both times are set
                if (record.ClockIn.HasValue && record.ClockOut.HasValue)
                {
                    var totalMinutes = (record.ClockOut.Value - record.ClockIn.Value).TotalMinutes;
                    totalMinutes -= (double)(record.BreakDuration * 60);
                    record.TotalHours = (decimal)(totalMinutes / 60);

                    record.OvertimeHours = record.TotalHours > 8 ? record.TotalHours.Value - 8 : 0;
                }

                var success = await _attendanceRepository.UpdateAsync(record);
                if (!success)
                    return BadRequest(new { message = "Failed to update attendance record" });

                return Ok(new { message = "Attendance record updated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] UpdateAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/attendance/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttendance(long id)
        {
            try
            {
                var success = await _attendanceRepository.DeleteAsync(id);
                if (!success)
                    return NotFound(new { message = "Attendance record not found" });

                return Ok(new { message = "Attendance record deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] DeleteAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("driver/{driverId}/latest")]
        [Authorize]
        public async Task<ActionResult<AttendanceResponseDto>> GetLatestAttendance(string driverId)
        {
            try
            {
                var latestAttendance = await _attendanceRepository.GetLatestAttendanceAsync(driverId);

                if (latestAttendance == null)
                    return NotFound(new { message = "No attendance records found" });

                return Ok(MapToResponseDto(latestAttendance));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetLatestAttendance failed: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }


        // Helper method to get current user ID from various claim types
        private string? GetCurrentUserId()
        {
            // Try multiple claim types that might contain the user ID
            var userId = User.Claims.FirstOrDefault(c =>
                c.Type == ClaimTypes.NameIdentifier ||
                c.Type == "nameid" ||
                c.Type == "sub" ||
                c.Type == JwtRegisteredClaimNames.Sub ||
                c.Type == JwtRegisteredClaimNames.NameId)?.Value;

            return userId;
        }

        // Helper method to get current user name from various claim types
        private string? GetCurrentUserName()
        {
            var userName = User.Claims.FirstOrDefault(c =>
                c.Type == ClaimTypes.Name ||
                c.Type == "unique_name" ||
                c.Type == JwtRegisteredClaimNames.UniqueName)?.Value;

            return userName;
        }

        // Helper method to map DriverAttendance to AttendanceResponseDto
        private AttendanceResponseDto MapToResponseDto(DriverAttendance attendance)
        {
            return new AttendanceResponseDto
            {
                Id = attendance.Id,
                DriverId = attendance.DriverId,
                DriverName = attendance.Driver?.Name ?? "",
                Date = attendance.Date,
                ClockIn = attendance.ClockIn?.ToString(@"hh\:mm"),
                ClockOut = attendance.ClockOut?.ToString(@"hh\:mm"),
                TotalHours = attendance.TotalHours,
                BreakDuration = attendance.BreakDuration,
                OvertimeHours = attendance.OvertimeHours,
                Status = attendance.Status,
                Location = attendance.Location,
                Notes = attendance.Notes,
                ApprovedBy = attendance.ApprovedBy,
                ApproverName = attendance.Approver?.Name,
                CreatedAt = attendance.CreatedAt,
                UpdatedAt = attendance.UpdatedAt
            };
        }

        // Helper method to map stats dictionary to AttendanceStatsDto
        private AttendanceStatsDto MapToStatsDto(Dictionary<string, object> stats)
        {
            return new AttendanceStatsDto
            {
                TotalHours = (decimal)stats["TotalHours"],
                DaysPresent = (int)stats["DaysPresent"],
                DaysAbsent = (int)stats["DaysAbsent"],
                DaysLate = (int)stats["DaysLate"],
                AverageClockIn = stats["AverageClockIn"].ToString() ?? "",
                OvertimeHours = (decimal)stats["OvertimeHours"],
                AttendancePercentage = (decimal)stats["AttendancePercentage"]
            };
        }
    }
}