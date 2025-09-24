using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Route = FleetManagerPro.API.Models.Route;


namespace FleetManagerPro.API.Models
{
    [Table("route_stops")]
    public class RouteStop
    {
        [Key]
        public string Id { get; set; } = "";

        [Required]
        [Column("route_id")]
        public string RouteId { get; set; }

        [Column("stop_order")]
        public int StopOrder { get; set; }

        [Required, StringLength(500)]
        public string Address { get; set; } = string.Empty;

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        [Column("estimated_arrival")]
        public DateTime? EstimatedArrival { get; set; }

        [Column("actual_arrival")]
        public DateTime? ActualArrival { get; set; }

        [Column("estimated_departure")]
        public DateTime? EstimatedDeparture { get; set; }

        [Column("actual_departure")]
        public DateTime? ActualDeparture { get; set; }

        public StopPriority Priority { get; set; } = StopPriority.Medium;
        public StopStatus Status { get; set; } = StopStatus.Pending;

        public string? Notes { get; set; }

        [Column("contact_name")]
        [StringLength(100)]
        public string? ContactName { get; set; }

        [Column("contact_phone")]
        [StringLength(20)]
        public string? ContactPhone { get; set; }

        [Column("service_time")]
        public int ServiceTime { get; set; } = 15;

        [Column("delivery_instructions")]
        public string? DeliveryInstructions { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation
        public Route Route { get; set; } = null!;
    }

    public enum StopPriority
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum StopStatus
    {
        Pending,
        InTransit,
        Arrived,
        Completed,
        Skipped,
        Failed
    }
}
