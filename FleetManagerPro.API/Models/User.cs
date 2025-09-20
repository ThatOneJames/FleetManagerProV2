using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FleetManagerPro.API.Models
{
    public enum UserRole
    {
        Admin,
        Driver,
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        OnLeave,
        Suspended
    }

    [Table("users")]
    public class User
    {
        [Key]
        [StringLength(128)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Name { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string PasswordHash { get; set; }

        [Column("role")] // match lowercase in DB
        public string RoleString { get; set; }

        [NotMapped]
        public UserRole Role
        {
            get => Enum.Parse<UserRole>(RoleString, true);
            set => RoleString = value.ToString();
        }

        [Column("status")]
        [MaxLength(50)]
        public string StatusString { get; set; }

        [NotMapped]
        public UserStatus Status
        {
            get => Enum.Parse<UserStatus>(StatusString, true);
            set => StatusString = value.ToString();
        }

        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? EmergencyContact { get; set; }
        public DateTime? HireDate { get; set; }
        public string? Phone { get; set; }


        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property for the one-to-one relationship with Driver
        [JsonIgnore]
        public Driver? Driver { get; set; }
    }
}
