namespace FleetManagerPro.API.DTOs
{
    public class RouteStopDto
    {
        public string Id { get; set; }
        public string Location { get; set; }
        public int Sequence { get; set; }  // order in route
        public DateTime? EstimatedArrival { get; set; }
    }
}
