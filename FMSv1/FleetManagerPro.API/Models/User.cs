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

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(255)]
        public string? Address { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("hire_date")]
        public DateTime? HireDate { get; set; }

        [Column("emergency_contact")]
        [StringLength(255)]
        public string? EmergencyContact { get; set; }

        [Required]
        public UserStatus Status { get; set; } = UserStatus.Active;

        [Column("profile_image_url")]
        [StringLength(500)]
        public string? ProfileImageUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property (1-to-1 with Driver)
        public Driver? Driver { get; set; }
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
        OnLeave,
        Suspended
    }
}
