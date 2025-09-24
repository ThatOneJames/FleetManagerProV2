using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    public class Vehicle
    {
        [Key]
        [StringLength(128)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [ForeignKey(nameof(VehicleCategory))]
        [Column("category_id")]
        public string CategoryId { get; set; }

        [Required]
        [StringLength(50)]
        public string Make { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Model { get; set; } = string.Empty;

        [Required]
        public int Year { get; set; }

        [Required]
        [Column("license_plate")]
        [StringLength(20)]
        public string LicensePlate { get; set; } = string.Empty;

        [StringLength(30)]
        public string? Color { get; set; }

        [Required]
        [Column("fuel_type")]
        public FuelType FuelType { get; set; }

        [Column("fuel_capacity")]
        public decimal? FuelCapacity { get; set; }

        [Column("current_mileage")]
        public decimal CurrentMileage { get; set; } = 0;

        [Required]
        public VehicleStatus Status { get; set; } = VehicleStatus.Ready;

        [ForeignKey(nameof(CurrentDriver))]
        [Column("current_driver_id")]
        // This is now a string to match the User.Id primary key
        public string? CurrentDriverId { get; set; }

        [Column("current_location_lat")]
        public decimal? CurrentLocationLat { get; set; }

        [Column("current_location_lng")]
        public decimal? CurrentLocationLng { get; set; }

        [Column("last_location_updated")]
        public DateTime? LastLocationUpdated { get; set; }

        [Column("fuel_level")]
        public decimal FuelLevel { get; set; } = 100;

        [Required]
        [Column("registration_expiry")]
        public DateTime RegistrationExpiry { get; set; }

        [Required]
        [Column("insurance_expiry")]
        public DateTime InsuranceExpiry { get; set; }

        [Column("insurance_policy")]
        [StringLength(100)]
        public string? InsurancePolicy { get; set; }

        [Column("purchase_date")]
        public DateTime? PurchaseDate { get; set; }

        [Column("purchase_price")]
        public decimal? PurchasePrice { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public VehicleCategory? Category { get; set; }
        public Driver? CurrentDriver { get; set; }
        public ICollection<Route> Routes { get; set; } = new List<Route>();
        public ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();
    }

    public enum FuelType
    {
        Gasoline,
        Diesel,
        Electric,
        Hybrid
    }

    public enum VehicleStatus
    {
        Ready,
        Active,
        Maintenance,
        Inactive,
        OnRoute,
        Retired,
        NotAvailable
    }

    public class VehicleCategory
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    }
}
