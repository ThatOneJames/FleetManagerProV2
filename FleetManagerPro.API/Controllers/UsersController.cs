using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();
            return Ok(users);
        }

        // GET: api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        // GET: api/users/current - TEMPORARY: Removed [Authorize] for testing
        [HttpGet("current")]
        // [Authorize] // Commented out temporarily for debugging
        public async Task<IActionResult> GetCurrentUser()
        {
            // For testing purposes, return a hardcoded user or the first user
            // THIS IS JUST FOR DEBUGGING - REMOVE IN PRODUCTION

            // Try to get user ID from headers first (if token is being sent)
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader != null && authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                // Log the token for debugging (remove in production)
                Console.WriteLine($"Received token: {token.Substring(0, Math.Min(20, token.Length))}...");

                try
                {
                    // Try to decode the token manually for debugging
                    var parts = token.Split('.');
                    if (parts.Length == 3)
                    {
                        var payload = parts[1];
                        // Add padding if needed
                        switch (payload.Length % 4)
                        {
                            case 2: payload += "=="; break;
                            case 3: payload += "="; break;
                        }
                        var decodedBytes = Convert.FromBase64String(payload);
                        var decodedPayload = System.Text.Encoding.UTF8.GetString(decodedBytes);
                        Console.WriteLine($"Token payload: {decodedPayload}");

                        // Parse the payload and extract user ID
                        // This is basic parsing - you might need to use a proper JWT library
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error decoding token: {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine("No Authorization header found");
            }

            // For now, return the first user for testing
            var users = await _userRepository.GetAllAsync();
            var firstUser = users.FirstOrDefault();

            if (firstUser == null)
            {
                return NotFound("No users found");
            }

            return Ok(firstUser);
        }

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] User updatedUser)
        {
            if (id != updatedUser.Id)
            {
                return BadRequest("ID mismatch");
            }

            var existingUser = await _userRepository.GetByIdAsync(id);
            if (existingUser == null)
            {
                return NotFound();
            }

            // Update the user
            var success = await _userRepository.UpdateAsync(updatedUser);
            if (!success)
            {
                return BadRequest("Failed to update user");
            }

            return NoContent();
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _userRepository.DeleteAsync(id);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}