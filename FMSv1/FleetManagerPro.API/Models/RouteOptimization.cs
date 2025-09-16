using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    public class RouteOptimization
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Column("route_id")]
        [StringLength(50)]
        public string RouteId { get; set; } = string.Empty;

        [Column("original_distance")]
        public decimal OriginalDistance { get; set; }

        [Column("optimized_distance")]
        public decimal OptimizedDistance { get; set; }

        [Column("distance_saved")]
        public decimal DistanceSaved { get; set; }

        [Column("original_duration")]
        public int OriginalDuration { get; set; }

        [Column("optimized_duration")]
        public int OptimizedDuration { get; set; }

        [Column("time_saved")]
        public int TimeSaved { get; set; }

        [Column("fuel_saved")]
        public decimal FuelSaved { get; set; }

        [Column("optimization_algorithm")]
        [StringLength(50)]
        public string OptimizationAlgorithm { get; set; } = "Basic";

        [Column("optimized_at")]
        public DateTime OptimizedAt { get; set; } = DateTime.UtcNow;

        [Column("optimized_by")]
        [StringLength(128)]
        public string OptimizedBy { get; set; } = string.Empty;

        // Navigation properties
        public Route Route { get; set; } = null!;
        public User OptimizedByUser { get; set; } = null!;
    }
}
