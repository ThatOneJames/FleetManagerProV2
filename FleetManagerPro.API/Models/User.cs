using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [StringLength(128)]
        public string Id { get; set; } = string.Empty; // Firebase UID

        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, StringLength(255), EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(255)]
        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }
        public DateTime? HireDate { get; set; }

        public string Username { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;

        [StringLength(255)]
        public string? EmergencyContact { get; set; }

        [Required]
        public UserStatus Status { get; set; } = UserStatus.Active;

        [StringLength(500)]
        public string? ProfileImageUrl { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation (1-to-1 with Driver)
        public Driver? Driver { get; set; }
    }

    public enum UserRole { Admin, Driver, User }
    public enum UserStatus { Active, Inactive, OnLeave, Suspended }
}
