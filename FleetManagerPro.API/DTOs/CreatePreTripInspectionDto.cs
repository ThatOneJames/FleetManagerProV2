using System;
using System.ComponentModel.DataAnnotations;

namespace FleetManagerPro.API.DTOs
{
    public class CreatePreTripInspectionDto
    {
        [Required]
        public string RouteId { get; set; } = string.Empty;

        [Required]
        public string VehicleId { get; set; } = string.Empty;

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

        public string? Notes { get; set; }
    }
}
