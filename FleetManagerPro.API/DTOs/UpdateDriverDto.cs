namespace FleetManagerPro.API.DTOs.Drivers
{
    public class UpdateDriverDto
    {
        public string FullName { get; set; }
        public string LicenseNumber { get; set; }
        public string ContactNumber { get; set; }
        public bool HasHelper { get; set; }
    }
}
