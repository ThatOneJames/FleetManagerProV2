public class DriverWarning
{
    public string Id { get; set; }
    public string DriverId { get; set; }
    public string Reason { get; set; }
    public string IssuedBy { get; set; }
    public DateTime DateIssued { get; set; } = DateTime.UtcNow;
}