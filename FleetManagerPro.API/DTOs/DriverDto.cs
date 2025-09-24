namespace FleetManagerPro.API.DTOs
{
    public class DriverDto
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; }
        public string LicenseNumber { get; set; }
        public string ContactNumber { get; set; }
        public bool HasHelper { get; set; }
    }
}
