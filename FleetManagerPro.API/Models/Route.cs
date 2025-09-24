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

        [StringLength(255)]
        public string? StartLocation { get; set; }

        [StringLength(255)]
        public string? EndLocation { get; set; }

        public double? DistanceKm { get; set; }
        public double? EstimatedDurationHours { get; set; }

        // The VehicleId property should also be a string to match the Vehicle's ID.
        public string VehicleId { get; set; } = null!;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation
        public ICollection<Driver> AssignedDrivers { get; set; } = new List<Driver>();
        public ICollection<Vehicle> AssignedVehicles { get; set; } = new List<Vehicle>();

        // Relationships
        public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();
        public RouteOptimization? Optimization { get; set; }
    }
}