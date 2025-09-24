using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System;

namespace FleetManagerPro.API.Models
{
    public class User
    {
        [Column("id")]
        public string Id { get; set; } = "";

        [Column("name")]
        [Required]
        public string Name { get; set; } = "";

        [Column("email")]
        [Required]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Column("password_hash")]
        [Required]
        public string PasswordHash { get; set; } = "";

        [Column("phone")]
        public string? Phone { get; set; }
        [Column("address")]
        public string? Address { get; set; }
        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }
        [Column("hire_date")]
        public DateTime? HireDate { get; set; }
        [Column("emergency_contact")]
        public string? EmergencyContact { get; set; }
        [Column("profile_image_url")]
        public string? ProfileImageUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("role")]
        [NotMapped]
        public string RoleString { get; set; } = "Driver";
        [Column("status")]
        [NotMapped]
        public string StatusString { get; set; } = "Active";

        public Driver? Driver { get; set; }

        [NotMapped]
        public UserRole Role
        {
            get => Enum.TryParse<UserRole>(RoleString, true, out var role) ? role : UserRole.Driver;
            set => RoleString = value.ToString();
        }

        [NotMapped]
        public UserStatus Status
        {
            get => Enum.TryParse<UserStatus>(StatusString, true, out var status) ? status : UserStatus.Active;
            set => StatusString = value.ToString();
        }
    }

public enum UserRole
    {
        Admin,
        Driver
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        Suspended
    }
}