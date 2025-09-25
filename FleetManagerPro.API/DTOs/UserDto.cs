namespace FleetManagerPro.API.DTOs
{

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public DateTime? HireDate { get; set; }
        public string EmergencyContact { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;

        // Driver fields
        public string LicenseNumber { get; set; } = string.Empty;
        public string LicenseClass { get; set; } = string.Empty;
        public DateTime? LicenseExpiry { get; set; }
        public int ExperienceYears { get; set; }
        public int SafetyRating { get; set; }
        public long TotalMilesDriven { get; set; }
    }
}
