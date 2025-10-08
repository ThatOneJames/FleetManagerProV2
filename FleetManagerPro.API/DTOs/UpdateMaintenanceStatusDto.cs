namespace FleetManagerPro.API.DTOs
{
    public class UpdateMaintenanceStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? AssignedMechanic { get; set; }
        public string? RepairNotes { get; set; }
    }
}
    