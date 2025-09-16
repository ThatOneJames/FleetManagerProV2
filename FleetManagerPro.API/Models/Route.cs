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
        public int Id { get; set; }

        [Required, StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(255)]
        public string? StartLocation { get; set; }

        [StringLength(255)]
        public string? EndLocation { get; set; }

        public double? DistanceKm { get; set; }
        public double? EstimatedDurationHours { get; set; }

        public int VehicleId { get; set; }

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
