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
        // This is the correct ID property.
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required, StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [Column("vehicle_id")]
        public string VehicleId { get; set; } = string.Empty;

        [ForeignKey("VehicleId")]
        public Vehicle Vehicle { get; set; } = null!;

        [StringLength(255)]
        public string? StartLocation { get; set; }

        [StringLength(255)]
        public string? EndLocation { get; set; }

        public double? DistanceKm { get; set; }
        public double? EstimatedDurationHours { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation
        public ICollection<User> AssignedDrivers { get; set; } = new List<User>();


        // Relationships
        public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();
        public RouteOptimization? Optimization { get; set; }
    }
}