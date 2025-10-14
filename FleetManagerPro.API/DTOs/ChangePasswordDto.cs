using System.ComponentModel.DataAnnotations;

namespace FleetManagerPro.API.DTOs.Users
{
    public class ChangePasswordDto
    {
        [Required]
        [MinLength(6)]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
