//For Admin updating

namespace FleetManagerPro.API.DTOs.Users
{
    public class UpdateUserDto
    {
        public string Email { get; set; }
        public string Role { get; set; }
        public string Status { get; set; }
    }
}
