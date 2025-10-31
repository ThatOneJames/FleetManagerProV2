using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.DTOs.Users;
using FleetManagerPro.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;

namespace FleetManagerPro.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly DriverDisciplinaryService _disciplinaryService;
        private readonly IAuditService _auditService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            FleetManagerDbContext context,
            IConfiguration configuration,
            DriverDisciplinaryService disciplinaryService,
            IAuditService auditService,
            ILogger<UsersController> logger)
        {
            _context = context;
            _configuration = configuration;
            _disciplinaryService = disciplinaryService;
            _auditService = auditService;
            _logger = logger;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<IEnumerable<User>>> GetAllUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        u.Id,
                        u.Name,
                        u.Email,
                        u.Role,
                        u.Phone,
                        u.Address,
                        u.DateOfBirth,
                        u.EmergencyContact,
                        u.Status,
                        IsActive = u.Status == "Active",
                        u.LicenseNumber,
                        u.LicenseClass,
                        u.LicenseExpiry,
                        u.ExperienceYears,
                        u.SafetyRating,
                        u.TotalMilesDriven,
                        u.IsAvailable,
                        u.HasHelper,
                        u.LastLocationUpdated,
                        u.CreatedAt,
                        u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error retrieving users: {ex.Message}");
                _logger.LogError(ex, "Error retrieving users");
                return StatusCode(500, new { message = "Error retrieving users", error = ex.Message });
            }
        }

        [HttpGet("current")]
        [Authorize]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            try
            {
                var userId = GetUserId();

                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.Phone,
                    user.Address,
                    user.DateOfBirth,
                    user.EmergencyContact,
                    user.ProfileImageUrl,
                    user.Status,
                    user.LicenseNumber,
                    user.LicenseClass,
                    user.LicenseExpiry,
                    user.ExperienceYears,
                    user.SafetyRating,
                    user.TotalMilesDriven,
                    user.CurrentVehicleId,
                    user.IsAvailable,
                    user.HasHelper,
                    user.CreatedAt,
                    user.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error retrieving current user: {ex.Message}");
                _logger.LogError(ex, "Error retrieving current user");
                return StatusCode(500, new { message = "Error retrieving current user", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<User>> GetUser(string id)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.Id == id)
                    .Select(u => new
                    {
                        u.Id,
                        u.Name,
                        u.Email,
                        u.Role,
                        u.Phone,
                        u.Address,
                        u.DateOfBirth,
                        u.EmergencyContact,
                        u.Status,
                        IsActive = u.Status == "Active",
                        u.LicenseNumber,
                        u.LicenseClass,
                        u.LicenseExpiry,
                        u.ExperienceYears,
                        u.SafetyRating,
                        u.TotalMilesDriven,
                        u.IsAvailable,
                        u.HasHelper,
                        u.LastLocationUpdated,
                        u.CreatedAt,
                        u.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error retrieving user {id}: {ex.Message}");
                _logger.LogError(ex, "Error retrieving user {Id}", id);
                return StatusCode(500, new { message = "Error retrieving user", error = ex.Message });
            }
        }

        [HttpGet("drivers")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<IEnumerable<User>>> GetDrivers()
        {
            try
            {
                var drivers = await _context.Users
                    .Where(u => u.Role == "Driver")
                    .Select(u => new
                    {
                        u.Id,
                        u.Name,
                        u.Email,
                        u.Phone,
                        u.Role,
                        u.Status,
                        IsActive = u.Status == "Active",
                        u.LicenseNumber,
                        u.LicenseClass,
                        u.LicenseExpiry,
                        u.ExperienceYears
                    })
                    .ToListAsync();

                return Ok(drivers);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error retrieving drivers: {ex.Message}");
                _logger.LogError(ex, "Error retrieving drivers");
                return StatusCode(500, new { message = "Error retrieving drivers", error = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<User>> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                    return BadRequest(new { message = "Email already registered" });

                var userId = "USR-" + DateTime.UtcNow.Ticks.ToString().Substring(8);
                var passwordHash = HashPassword(registerDto.Password);

                var user = new User
                {
                    Id = userId,
                    Name = registerDto.Name,
                    Email = registerDto.Email,
                    PasswordHash = passwordHash,
                    Role = registerDto.Role ?? "Driver",
                    Phone = registerDto.Phone,
                    Address = registerDto.Address,
                    DateOfBirth = registerDto.DateOfBirth,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                await _auditService.LogActionAsync(
                    userId,
                    "CREATE",
                    "User",
                    userId,
                    $"User registered: {registerDto.Name} ({registerDto.Role ?? "Driver"})",
                    null,
                    new { user.Name, user.Email, user.Role }
                );

                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.Phone,
                    user.Status,
                    user.CreatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error creating user: {ex.Message}");
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, new { message = "Error creating user", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ArchiveUser(string id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                var oldStatus = user.Status;
                user.Status = "Archived";
                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                await _auditService.LogActionAsync(
                    GetUserId(),
                    "DELETE",
                    "User",
                    id,
                    $"Archived user: {user.Name}",
                    new { Status = oldStatus },
                    new { Status = user.Status }
                );

                return Ok(new { message = "User archived (soft deleted) successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error archiving user {id}: {ex.Message}");
                _logger.LogError(ex, "Error archiving user {Id}", id);
                return StatusCode(500, new { message = "Error archiving user", error = ex.Message });
            }
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetUserStats()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var activeUsers = await _context.Users.Where(u => u.Status == "Active").CountAsync();
                var inactiveUsers = await _context.Users.Where(u => u.Status == "Inactive").CountAsync();
                var suspendedUsers = await _context.Users.Where(u => u.Status == "Suspended").CountAsync();

                var usersByRole = await _context.Users
                    .GroupBy(u => u.Role)
                    .Select(g => new { Role = g.Key, Count = g.Count() })
                    .ToListAsync();

                var stats = new
                {
                    total = totalUsers,
                    active = activeUsers,
                    inactive = inactiveUsers,
                    suspended = suspendedUsers,
                    byRole = usersByRole.ToDictionary(x => x.Role, x => x.Count)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error retrieving user statistics: {ex.Message}");
                _logger.LogError(ex, "Error retrieving user statistics");
                return StatusCode(500, new { message = "Error retrieving user statistics", error = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                Console.WriteLine($"[USERS] UpdateUserStatus called for ID: {id}, Status: {dto.Status}");

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    Console.WriteLine($"[USERS] User not found: {id}");
                    return NotFound(new { message = "User not found" });
                }

                var oldStatus = user.Status;
                user.Status = dto.Status;
                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[USERS] Status updated from {oldStatus} to {dto.Status}");

                await _auditService.LogActionAsync(
                    GetUserId(),
                    "UPDATE",
                    "User",
                    id,
                    $"Updated user status from {oldStatus} to {dto.Status}",
                    new { Status = oldStatus },
                    new { Status = dto.Status }
                );

                return Ok(new
                {
                    message = $"User status updated to {dto.Status}",
                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        user.Status,
                        user.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error updating user status {id}: {ex.Message}");
                _logger.LogError(ex, "Error updating user status {Id}", id);
                return StatusCode(500, new { message = "Error updating user status", error = ex.Message });
            }
        }

        [HttpPatch("{id}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleDto dto)
        {
            try
            {
                Console.WriteLine($"[USERS] UpdateUserRole called for ID: {id}, Role: {dto.Role}");

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    Console.WriteLine($"[USERS] User not found: {id}");
                    return NotFound(new { message = "User not found" });
                }

                var validRoles = new[] { "Admin", "Manager", "Driver" };
                if (!validRoles.Contains(dto.Role))
                    return BadRequest(new { message = "Invalid role. Must be Admin, Manager, or Driver" });

                var oldRole = user.Role;
                user.Role = dto.Role;
                user.UpdatedAt = DateTime.UtcNow;

                Console.WriteLine($"[USERS] Setting role from {oldRole} to {dto.Role}");

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[USERS] Role updated successfully");

                await _auditService.LogActionAsync(
                    GetUserId(),
                    "UPDATE",
                    "User",
                    id,
                    $"Updated user role from {oldRole} to {dto.Role}",
                    new { Role = oldRole },
                    new { Role = dto.Role }
                );

                return Ok(new
                {
                    message = "User role updated successfully",
                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        user.Role,
                        user.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error updating user role {id}: {ex.Message}");
                Console.WriteLine($"[USERS] Stack: {ex.StackTrace}");
                _logger.LogError(ex, "Error updating user role {Id}", id);
                return StatusCode(500, new { message = "Error updating user role", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
        {
            try
            {
                Console.WriteLine($"[USERS] UpdateUser called for ID: {id}");
                Console.WriteLine($"[USERS] Received DTO: {System.Text.Json.JsonSerializer.Serialize(dto)}");

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    Console.WriteLine($"[USERS] User not found: {id}");
                    return NotFound(new { message = "User not found" });
                }

                var oldValue = new
                {
                    user.Name,
                    user.Email,
                    user.Phone,
                    user.Address,
                    user.Role,
                    user.Status
                };

                bool changed = false;

                if (!string.IsNullOrEmpty(dto.Name) && dto.Name != user.Name)
                {
                    user.Name = dto.Name;
                    changed = true;
                    Console.WriteLine($"[USERS] Name changed to {dto.Name}");
                }

                if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
                {
                    if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                        return BadRequest(new { message = "Email already in use" });
                    user.Email = dto.Email;
                    changed = true;
                    Console.WriteLine($"[USERS] Email changed to {dto.Email}");
                }

                if (!string.IsNullOrEmpty(dto.Phone) && dto.Phone != user.Phone)
                {
                    user.Phone = dto.Phone;
                    changed = true;
                    Console.WriteLine($"[USERS] Phone changed to {dto.Phone}");
                }

                if (!string.IsNullOrEmpty(dto.Address) && dto.Address != user.Address)
                {
                    user.Address = dto.Address;
                    changed = true;
                    Console.WriteLine($"[USERS] Address changed");
                }

                if (!string.IsNullOrEmpty(dto.Role) && dto.Role != user.Role)
                {
                    var validRoles = new[] { "Admin", "Manager", "Driver" };
                    if (!validRoles.Contains(dto.Role))
                        return BadRequest(new { message = "Invalid role. Must be Admin, Manager, or Driver" });
                    user.Role = dto.Role;
                    changed = true;
                    Console.WriteLine($"[USERS] Role changed from {oldValue.Role} to {dto.Role}");
                }

                if (!string.IsNullOrEmpty(dto.Status) && dto.Status != user.Status)
                {
                    user.Status = dto.Status;
                    changed = true;
                    Console.WriteLine($"[USERS] Status changed from {oldValue.Status} to {dto.Status}");
                }

                if (!changed)
                {
                    Console.WriteLine($"[USERS] No changes detected");
                    return Ok(new
                    {
                        message = "No changes made",
                        user = new
                        {
                            user.Id,
                            user.Name,
                            user.Email,
                            user.Role,
                            user.Status,
                            user.UpdatedAt
                        }
                    });
                }

                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[USERS] User {id} updated successfully");

                await _auditService.LogActionAsync(
                    GetUserId(),
                    "UPDATE",
                    "User",
                    id,
                    $"Updated user details: {user.Name}",
                    oldValue,
                    new { user.Name, user.Email, user.Phone, user.Address, user.Role, user.Status }
                );

                return Ok(new
                {
                    message = "User updated successfully",
                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        user.Phone,
                        user.Address,
                        user.Role,
                        user.Status,
                        user.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error updating user {id}: {ex.Message}");
                Console.WriteLine($"[USERS] Stack: {ex.StackTrace}");
                _logger.LogError(ex, "Error updating user {Id}", id);
                return StatusCode(500, new { message = "Error updating user", error = ex.Message });
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateOwnProfile([FromBody] UpdateDriverProfileDto dto)
        {
            try
            {
                Console.WriteLine($"[USERS] UpdateOwnProfile called");

                var userId = GetUserId();

                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                var oldValue = new
                {
                    user.Name,
                    user.Email,
                    user.Phone,
                    user.LicenseNumber,
                    user.LicenseExpiry
                };

                if (!string.IsNullOrEmpty(dto.Name))
                    user.Name = dto.Name;

                if (!string.IsNullOrEmpty(dto.Email))
                {
                    if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != userId))
                        return BadRequest(new { message = "Email already in use" });
                    user.Email = dto.Email;
                }

                if (!string.IsNullOrEmpty(dto.Phone))
                    user.Phone = dto.Phone;

                if (!string.IsNullOrEmpty(dto.Address))
                    user.Address = dto.Address;

                if (!string.IsNullOrEmpty(dto.EmergencyContact))
                    user.EmergencyContact = dto.EmergencyContact;

                if (!string.IsNullOrEmpty(dto.LicenseNumber))
                    user.LicenseNumber = dto.LicenseNumber;

                if (!string.IsNullOrEmpty(dto.LicenseClass))
                    user.LicenseClass = dto.LicenseClass;

                if (dto.LicenseExpiry.HasValue)
                    user.LicenseExpiry = dto.LicenseExpiry;

                if (dto.DateOfBirth.HasValue)
                    user.DateOfBirth = dto.DateOfBirth;

                if (dto.ExperienceYears.HasValue)
                    user.ExperienceYears = dto.ExperienceYears.Value;

                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[USERS] Profile updated successfully");

                await _auditService.LogActionAsync(
                    userId,
                    "UPDATE",
                    "User",
                    userId,
                    $"Updated own profile",
                    oldValue,
                    new { user.Name, user.Email, user.Phone, user.LicenseNumber, user.LicenseExpiry }
                );

                return Ok(new
                {
                    message = "Profile updated successfully",
                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        user.Phone,
                        user.Address,
                        user.EmergencyContact,
                        user.LicenseNumber,
                        user.LicenseClass,
                        user.LicenseExpiry,
                        user.DateOfBirth,
                        user.ExperienceYears,
                        user.Role,
                        user.Status,
                        user.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error updating profile: {ex.Message}");
                _logger.LogError(ex, "Error updating profile");
                return StatusCode(500, new { message = "Error updating profile", error = ex.Message });
            }
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                Console.WriteLine($"[USERS] ChangePassword called");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = GetUserId();

                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                    return BadRequest(new { message = "Current password is incorrect" });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[USERS] Password changed successfully");

                await _auditService.LogActionAsync(
                    userId,
                    "UPDATE",
                    "User",
                    userId,
                    $"Changed password",
                    null,
                    new { PasswordChanged = true }
                );

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error changing password: {ex.Message}");
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, new { message = "Error changing password", error = ex.Message });
            }
        }

        [HttpPut("{id}/change-password")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ChangeUserPassword(string id, [FromBody] ChangeUserPasswordDto dto)
        {
            try
            {
                Console.WriteLine($"[USERS] ChangeUserPassword called for ID: {id}");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[USERS] Password changed for user {id}");

                await _auditService.LogActionAsync(
                    GetUserId(),
                    "UPDATE",
                    "User",
                    id,
                    $"Admin changed password for user: {user.Name}",
                    null,
                    new { PasswordChanged = true }
                );

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error changing user password {id}: {ex.Message}");
                _logger.LogError(ex, "Error changing user password {Id}", id);
                return StatusCode(500, new { message = "Error changing password", error = ex.Message });
            }
        }

        [HttpGet("{driverId}/warnings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDriverWarnings(string driverId)
        {
            try
            {
                var warnings = await _disciplinaryService.GetWarningsByDriverAsync(driverId);
                if (warnings == null || warnings.Count == 0)
                    return NotFound(new { message = "No warnings found for the specified driver" });

                return Ok(warnings);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error retrieving warnings for driver {driverId}: {ex.Message}");
                _logger.LogError(ex, "Error retrieving warnings for driver {DriverId}", driverId);
                return StatusCode(500, new { message = "Error retrieving warnings", error = ex.Message });
            }
        }

        [HttpPost("{driverId}/warnings")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddDriverWarning(string driverId, [FromBody] CreateDriverWarningDto dto)
        {
            try
            {
                var warning = await _disciplinaryService.AddWarningAsync(driverId, dto.Reason, dto.IssuedBy);

                await _auditService.LogActionAsync(
                    GetUserId(),
                    "CREATE",
                    "DriverWarning",
                    driverId,
                    $"Added warning: {dto.Reason}",
                    null,
                    new { driverId, Reason = dto.Reason, IssuedBy = dto.IssuedBy }
                );

                return Ok(warning);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error adding warning for driver {driverId}: {ex.Message}");
                _logger.LogError(ex, "Error adding warning for driver {DriverId}", driverId);
                return StatusCode(500, new { message = "Error adding warning", error = ex.Message });
            }
        }

        [HttpGet("{driverId}/suspensions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDriverSuspensions(string driverId)
        {
            try
            {
                var suspensions = await _disciplinaryService.GetSuspensionsByDriverAsync(driverId);
                if (suspensions == null || suspensions.Count == 0)
                    return NotFound(new { message = "No suspensions found for the specified driver" });

                return Ok(suspensions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error retrieving suspensions for driver {driverId}: {ex.Message}");
                _logger.LogError(ex, "Error retrieving suspensions for driver {DriverId}", driverId);
                return StatusCode(500, new { message = "Error retrieving suspensions", error = ex.Message });
            }
        }

        [HttpPost("{driverId}/suspensions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddDriverSuspension(string driverId, [FromBody] CreateDriverSuspensionDto dto)
        {
            try
            {
                var suspension = await _disciplinaryService.AddSuspensionAsync(driverId, dto.Reason, dto.IssuedBy, dto.AutoSuspended);

                await _auditService.LogActionAsync(
                    GetUserId(),
                    "CREATE",
                    "DriverSuspension",
                    driverId,
                    $"Added suspension: {dto.Reason} (Auto: {dto.AutoSuspended})",
                    null,
                    new { driverId, Reason = dto.Reason, IssuedBy = dto.IssuedBy, AutoSuspended = dto.AutoSuspended }
                );

                return Ok(suspension);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS] Error adding suspension for driver {driverId}: {ex.Message}");
                _logger.LogError(ex, "Error adding suspension for driver {DriverId}", driverId);
                return StatusCode(500, new { message = "Error adding suspension", error = ex.Message });
            }
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }

    public class CreateDriverWarningDto
    {
        public string Reason { get; set; }
        public string IssuedBy { get; set; }
    }

    public class CreateDriverSuspensionDto
    {
        public string Reason { get; set; }
        public string IssuedBy { get; set; }
        public bool AutoSuspended { get; set; }
    }

    public class RegisterDto
    {
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string? Role { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }

    public class UpdateRoleDto
    {
        public string Role { get; set; } = "";
    }

    public class UpdateUserDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateDriverProfileDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContact { get; set; }
        public string? LicenseNumber { get; set; }
        public string? LicenseClass { get; set; }
        public DateTime? LicenseExpiry { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? ExperienceYears { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = "";
        public string NewPassword { get; set; } = "";
    }

    public class ChangeUserPasswordDto
    {
        public string NewPassword { get; set; } = "";
    }
}
