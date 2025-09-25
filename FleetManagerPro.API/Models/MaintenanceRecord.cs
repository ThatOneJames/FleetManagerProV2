using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("maintenance_records")]
    public class MaintenanceRecord
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("vehicle_id")]
        [StringLength(128)]
        public string VehicleId { get; set; } = string.Empty;

        [Column("maintenance_date")]
        public DateTime MaintenanceDate { get; set; } = DateTime.UtcNow;

        [Required, StringLength(100)]
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        [StringLength(500)]
        [Column("description")]
        public string? Description { get; set; }

        [Column("cost")]
        public decimal Cost { get; set; }

        [Column("vehicle_plate")]
        public string VehiclePlate { get; set; } = null!;

        [Column("status")]
        public MaintenanceStatus Status { get; set; }

        [Column("performed_by")]
        [StringLength(100)]
        public string? PerformedBy { get; set; }

        [Column("due_date")]
        public DateTime? DueDate { get; set; }

        [Column("next_due_date")]
        public DateTime? NextDueDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation
        [ForeignKey("VehicleId")]
        public Vehicle Vehicle { get; set; } = null!;
    }

    public enum MaintenanceStatus
    {
        Scheduled,
        InProgress,
        Completed,
        Cancelled,
        Overdue
    }

    public enum MaintenanceSchedule
    {
        Daily,
        Weekly,
        Monthly,
        Quarterly,
        Yearly
    }
}
