using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("routes")]
    public class Route
    {
        [Key]
        [Column("id")]
        [StringLength(128)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("name")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("vehicle_id")]
        [StringLength(128)]
        public string VehicleId { get; set; } = string.Empty;

        [Required]
        [Column("driver_id")]
        [StringLength(128)]
        public string DriverId { get; set; } = string.Empty;

        [Required]
        [Column("status")]
        [StringLength(20)]
        public string Status { get; set; } = "planned";

        [Required]
        [Column("total_distance")]
        public decimal TotalDistance { get; set; }

        [Required]
        [Column("estimated_duration")]
        public int EstimatedDuration { get; set; }

        [Required]
        [Column("fuel_estimate")]
        public decimal FuelEstimate { get; set; }

        [Column("start_time")]
        public DateTime? StartTime { get; set; }

        [Column("end_time")]
        public DateTime? EndTime { get; set; }

        [Column("start_address")]
        [StringLength(255)]
        public string? StartAddress { get; set; }

        [Column("destination_address")]
        [StringLength(255)]
        public string? DestinationAddress { get; set; }

        [Column("google_maps_url")]
        public string? GoogleMapsUrl { get; set; }

        [Column("actual_duration")]
        public int? ActualDuration { get; set; }

        [Column("created_by")]
        [StringLength(128)]
        public string? CreatedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("VehicleId")]
        public Vehicle? Vehicle { get; set; }

        [ForeignKey("DriverId")]
        public User? Driver { get; set; }

        [ForeignKey("CreatedBy")]
        public User? Creator { get; set; }

        public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();

        // Add these properties to match your DbContext
        public RouteOptimization? Optimization { get; set; }
        public ICollection<User> AssignedDrivers { get; set; } = new List<User>();
    }
}