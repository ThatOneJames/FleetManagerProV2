namespace FleetManagerPro.API.DTOs
{
    public class CreateDriverSuspensionDto
    {
        public string Reason { get; set; }
        public string IssuedBy { get; set; }
        public bool AutoSuspended { get; set; }
    }
}
