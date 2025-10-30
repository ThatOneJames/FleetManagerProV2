public class DriverSuspension
{
	public string Id { get; set; }
	public string DriverId { get; set; }
	public string Reason { get; set; }
	public string IssuedBy { get; set; }
	public DateTime DateSuspended { get; set; } = DateTime.UtcNow;
	public bool AutoSuspended { get; set; }
}