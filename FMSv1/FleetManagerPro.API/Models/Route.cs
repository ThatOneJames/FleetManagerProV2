using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    public class Route
    {
        [Key]
        [StringLength(50)]
        public string Id { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Column("vehicle_id")]
        [StringLength(50)]
        public string? VehicleId { get; set; }

        [Column("driver_id")]
        [StringLength(128)]
        public string? DriverId { get; set; }

        public RouteStatus Status { get; set; } = RouteStatus.Draft;

        [Column("total_distance")]
        public decimal TotalDistance { get; set; } = 0;

        [Column("estimated_duration")]
        public int EstimatedDuration { get; set; } = 0;

        [Column("fuel_estimate")]
        public decimal FuelEstimate { get; set; } = 0;

        [Column("start_time")]
        public DateTime? StartTime { get; set; }

        [Column("end_time")]
        public DateTime? EndTime { get; set; }

        [Column("actual_duration")]
        public int? ActualDuration { get; set; }

        [Column("created_by")]
        [StringLength(128)]
        public string CreatedBy { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Vehicle? Vehicle { get; set; }
        public Driver? Driver { get; set; }
        public User CreatedByUser { get; set; } = null!;
        public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();
    }

    public enum RouteStatus
    {
        Draft,
        Active,
        InProgress,
        Completed,
        Cancelled,
        Optimized
    }
}
