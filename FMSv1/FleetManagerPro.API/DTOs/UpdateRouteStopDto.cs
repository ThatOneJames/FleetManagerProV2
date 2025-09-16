namespace FleetManagerPro.API.DTOs.Routes
{
    public class UpdateRouteStopDto
    {
        public string Location { get; set; }
        public int Sequence { get; set; }
        public DateTime? EstimatedArrival { get; set; }
    }
}
