namespace FleetManagerPro.API.DTOs.Routes
{
	public class CreateRouteStopDto
	{
		public string Location { get; set; }
		public int Sequence { get; set; }
		public DateTime? EstimatedArrival { get; set; }
	}
}
