namespace FleetManagerPro.API.DTOs
{
    public class CreateDriverWarningDto
    {
        public string Reason { get; set; }
        public string IssuedBy { get; set; }
        public string? Category { get; set; }
    }

}
