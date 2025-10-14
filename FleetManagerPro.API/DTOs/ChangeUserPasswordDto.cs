using System.ComponentModel.DataAnnotations;

namespace FleetManagerPro.API.DTOs.Users
{
    public class ChangeUserPasswordDto
    {
        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
