using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    public class PreTripInspection
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string RouteId { get; set; } = string.Empty;

        [Required]
        public string VehicleId { get; set; } = string.Empty;

        [Required]
        public string DriverId { get; set; } = string.Empty;

        [Required]
        public DateTime InspectionDate { get; set; }

        public bool EngineOilOk { get; set; }
        public bool CoolantOk { get; set; }
        public bool BatteryOk { get; set; }
        public bool BrakesOk { get; set; }
        public bool DashboardWarningLights { get; set; }
        public bool TirePressureOk { get; set; }
        public bool TireTreadOk { get; set; }
        public bool TireDamageCheck { get; set; }
        public bool WheelLugsOk { get; set; }
        public bool HeadlightsOk { get; set; }
        public bool BrakeLightsOk { get; set; }
        public bool TurnSignalsOk { get; set; }
        public bool HazardLightsOk { get; set; }
        public bool SeatbeltsOk { get; set; }
        public bool FireExtinguisherPresent { get; set; }
        public bool FirstAidKitPresent { get; set; }
        public bool WarningTrianglesPresent { get; set; }
        public bool MirrorsOk { get; set; }
        public bool WindshieldWipersOk { get; set; }
        public bool HornWorking { get; set; }
        public bool DoorsAndLocksOk { get; set; }

        public bool AllItemsPassed { get; set; }
        public string? Notes { get; set; }
        public string? IssuesFound { get; set; }
        public string? MaintenanceRequestId { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("RouteId")]
        public Route? Route { get; set; }

        [ForeignKey("VehicleId")]
        public Vehicle? Vehicle { get; set; }

        [ForeignKey("DriverId")]
        public User? Driver { get; set; }

        [ForeignKey("MaintenanceRequestId")]
        public MaintenanceRequest? MaintenanceRequest { get; set; }
    }
}
