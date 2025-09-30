using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("maintenance_reminders")]
    public class MaintenanceReminder
    {
        [Key]
        [Column("id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [Column("vehicle_id")]
        [StringLength(50)]
        public string VehicleId { get; set; } = string.Empty;

        [Required]
        [Column("category_id")]
        public int CategoryId { get; set; }

        [Required]
        [Column("reminder_type")]
        [StringLength(20)]
        public string ReminderType { get; set; } = "Both"; // Mileage, Date, Both

        [Column("next_service_miles", TypeName = "decimal(10,2)")]
        public decimal? NextServiceMiles { get; set; }

        [Column("next_service_date")]
        public DateTime? NextServiceDate { get; set; }

        [Column("interval_miles")]
        public int? IntervalMiles { get; set; }

        [Column("interval_months")]
        public int? IntervalMonths { get; set; }

        [Column("last_service_date")]
        public DateTime? LastServiceDate { get; set; }

        [Column("last_service_miles", TypeName = "decimal(10,2)")]
        public decimal? LastServiceMiles { get; set; }

        [Required]
        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("VehicleId")]
        public virtual Vehicle Vehicle { get; set; } = null!;

        [ForeignKey("CategoryId")]
        public virtual MaintenanceCategory Category { get; set; } = null!;
    }
}