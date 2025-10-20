using System.Text.RegularExpressions;

namespace FleetManagerPro.API.Services
{
    public interface IRouteEstimationService
    {
        RouteEstimation CalculateRouteEstimation(string startAddress, List<string> stopAddresses, string endAddress);
    }

    public class RouteEstimation
    {
        public decimal TotalDistanceKm { get; set; }
        public int TotalDurationMinutes { get; set; }
    }

    public class RouteEstimationService : IRouteEstimationService
    {
        private readonly ILogger<RouteEstimationService> _logger;

        private const decimal CITY_SPEED = 25m;
        private const decimal SUBURBAN_SPEED = 40m;
        private const decimal HIGHWAY_SPEED = 60m;
        private const decimal RURAL_SPEED = 50m;

        private const int STOP_TIME_MINUTES = 15;

        public RouteEstimationService(ILogger<RouteEstimationService> logger)
        {
            _logger = logger;
        }

        public RouteEstimation CalculateRouteEstimation(string startAddress, List<string> stopAddresses, string endAddress)
        {
            var allLocations = new List<string>();

            if (!string.IsNullOrEmpty(startAddress))
                allLocations.Add(startAddress);

            allLocations.AddRange(stopAddresses);

            if (!string.IsNullOrEmpty(endAddress))
                allLocations.Add(endAddress);

            decimal totalDistance = 0;
            int totalDuration = 0;

            for (int i = 0; i < allLocations.Count - 1; i++)
            {
                var from = allLocations[i];
                var to = allLocations[i + 1];

                var distance = EstimateDistance(from, to);
                var travelTime = CalculateTravelTime(from, to, distance);

                totalDistance += distance;
                totalDuration += travelTime;

                if (i < stopAddresses.Count)
                {
                    totalDuration += STOP_TIME_MINUTES;
                }
            }

            _logger.LogInformation("Route estimation: {Distance}km, {Duration}min",
                Math.Round(totalDistance, 1), totalDuration);

            return new RouteEstimation
            {
                TotalDistanceKm = Math.Round(totalDistance, 1),
                TotalDurationMinutes = totalDuration
            };
        }

        private decimal EstimateDistance(string from, string to)
        {
            return 25m;
        }

        private int CalculateTravelTime(string from, string to, decimal distanceKm)
        {
            var avgSpeed = DetermineAverageSpeed(from, to, distanceKm);
            var travelTimeHours = distanceKm / avgSpeed;
            var travelTimeMinutes = (int)Math.Ceiling(travelTimeHours * 60);

            decimal trafficBuffer = distanceKm < 10 ? 1.25m :
                                   distanceKm < 30 ? 1.20m :
                                   distanceKm < 60 ? 1.15m : 1.10m;

            return (int)Math.Ceiling(travelTimeMinutes * trafficBuffer);
        }

        private decimal DetermineAverageSpeed(string from, string to, decimal distance)
        {
            if (distance > 50)
                return HIGHWAY_SPEED;

            return CITY_SPEED;
        }

    }
}