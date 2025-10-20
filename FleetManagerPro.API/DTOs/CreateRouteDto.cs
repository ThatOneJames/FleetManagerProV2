namespace FleetManagerPro.API.DTOs.Routes
{
    public class CreateRouteDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VehicleId { get; set; } = string.Empty;
        public string DriverId { get; set; } = string.Empty;
        public string? StartAddress { get; set; }
        public string? DestinationAddress { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public List<CreateRouteStopDto> Stops { get; set; } = new();
    }

    public class CreateRouteStopDto
    {
        public int StopOrder { get; set; }
        public string Address { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public DateTime? EstimatedDeparture { get; set; }
        public string Priority { get; set; } = "normal";
        public string? Notes { get; set; }
        public string? ContactName { get; set; }
        public string? ContactPhone { get; set; }
    }
}