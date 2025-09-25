using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
	[Table("route_vehicles")]
	public class RouteVehicle
	{
		public string RouteId { get; set; } = string.Empty;
		public Route Route { get; set; } = null!;

		public string VehicleId { get; set; } = string.Empty;
		public Vehicle Vehicle { get; set; } = null!;
	}
}
