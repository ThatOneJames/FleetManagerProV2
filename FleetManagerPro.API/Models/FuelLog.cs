using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("fuel_logs")]
    public class FuelLog
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("vehicle_id")]
        public string VehicleId { get; set; } = string.Empty;

        [ForeignKey("VehicleId")]
        public Vehicle Vehicle { get; set; } = null!;

        [Column("driver_id")]
        public string? DriverId { get; set; }

        [ForeignKey("DriverId")]
        public User? Driver { get; set; }

        [Column("fuel_type")]
        public string FuelType { get; set; } = string.Empty;

        [Column("liters")]
        public double Liters { get; set; }

        [Column("cost")]
        public decimal Cost { get; set; }

        [Column("date")]
        public DateTime Date { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
