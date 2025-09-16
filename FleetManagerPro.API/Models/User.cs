using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)] // Disables auto-generation for this field
        public string Id { get; set; }

        public string Name { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string PasswordHash { get; set; }

        public UserRole Role { get; set; }

        public string Phone { get; set; }

        public string Address { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public DateTime? HireDate { get; set; }

        public string EmergencyContact { get; set; }

        public UserStatus Status { get; set; }

        public string ProfileImageUrl { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public Driver Driver { get; set; }
    }

    public enum UserRole
    {
        Admin,
        Driver,
        // Add other roles as needed
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        OnLeave,
        Suspended
    }
}