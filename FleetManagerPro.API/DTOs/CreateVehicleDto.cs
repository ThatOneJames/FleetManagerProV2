namespace FleetManagerPro.API.DTOs.Vehicles
{
    public class CreateVehicleDto
    {
        public string CategoryId { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
        public string LicensePlate { get; set; }
        public string Color { get; set; }
        public string FuelType { get; set; }
        public int FuelCapacity { get; set; }
        public double CurrentMileage { get; set; }
        public string Status { get; set; }
        public double FuelLevel { get; set; }
        public System.DateTime RegistrationExpiry { get; set; }
        public System.DateTime InsuranceExpiry { get; set; }
        public string InsurancePolicy { get; set; }
        public System.DateTime? PurchaseDate { get; set; }
        public double? PurchasePrice { get; set; }
    }
}
