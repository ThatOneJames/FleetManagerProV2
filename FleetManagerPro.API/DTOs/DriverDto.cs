namespace FleetManagerPro.API.DTOs
{
    public class DriverDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string LicenseNumber { get; set; }
        public string ContactNumber { get; set; }
        public bool HasHelper { get; set; }
    }
}
