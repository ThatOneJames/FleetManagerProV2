using System;

namespace FleetManagerPro.API.DTOs.Maintenance
{
    public class UpdateMaintenanceRecordDto
    {
        public string Description { get; set; } = null!;
        public DateTime MaintenanceDate { get; set; }
        public decimal Cost { get; set; }
    }
}
