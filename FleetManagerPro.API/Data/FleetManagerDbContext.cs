using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Models;
using Route = FleetManagerPro.API.Models.Route;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FleetManagerPro.API.Data
{
    public class FleetManagerDbContext : DbContext
    {
        public FleetManagerDbContext(DbContextOptions<FleetManagerDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Driver> Drivers { get; set; } = null!;
        public DbSet<Vehicle> Vehicles { get; set; } = null!;
        public DbSet<Route> Routes { get; set; } = null!;
        public DbSet<RouteStop> RouteStops { get; set; } = null!;
        public DbSet<RouteOptimization> RouteOptimizations { get; set; } = null!;
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; } = null!;
        //public DbSet<DriverAttendance> DriverAttendances { get; set; } = null!;
        public DbSet<LeaveRequest> LeaveRequests { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Address).HasColumnName("address");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
                entity.Property(e => e.Email).HasColumnName("email");
                entity.Property(e => e.EmergencyContact).HasColumnName("emergency_contact");
                entity.Property(e => e.HireDate).HasColumnName("hire_date");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
                entity.Property(e => e.Phone).HasColumnName("phone");
                entity.Property(e => e.ProfileImageUrl).HasColumnName("profile_image_url");
                entity.Property(e => e.RoleString).HasColumnName("role");   // ✅ Map string only
                entity.Property(e => e.StatusString).HasColumnName("status"); // ✅ Map string only
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                // One-to-one relationship between User and Driver
                entity.HasOne(u => u.Driver)
                      .WithOne(d => d.User)
                      .HasForeignKey<Driver>(d => d.UserId);
            });


            // 🔹 Explicit column name mapping and relationships for Vehicle entity
            modelBuilder.Entity<Vehicle>(entity =>
            {
                entity.ToTable("vehicles");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.CategoryId).HasColumnName("category_id");
                entity.Property(e => e.Make).HasColumnName("make");
                entity.Property(e => e.Model).HasColumnName("model");
                entity.Property(e => e.Year).HasColumnName("year");
                entity.Property(e => e.LicensePlate).HasColumnName("license_plate");
                entity.Property(e => e.Color).HasColumnName("color");
                entity.Property(e => e.FuelType).HasColumnName("fuel_type").HasConversion<string>(); // FIX: Changed from int to string
                entity.Property(e => e.FuelCapacity).HasColumnName("fuel_capacity");
                entity.Property(e => e.CurrentMileage).HasColumnName("current_mileage");
                entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>(); // FIX: Changed from int to string
                entity.Property(e => e.CurrentDriverId).HasColumnName("current_driver_id");
                entity.Property(e => e.CurrentLocationLat).HasColumnName("current_location_lat");
                entity.Property(e => e.CurrentLocationLng).HasColumnName("current_location_lng");
                entity.Property(e => e.LastLocationUpdated).HasColumnName("last_location_updated");
                entity.Property(e => e.FuelLevel).HasColumnName("fuel_level");
                entity.Property(e => e.RegistrationExpiry).HasColumnName("registration_expiry");
                entity.Property(e => e.InsuranceExpiry).HasColumnName("insurance_expiry");
                entity.Property(e => e.InsurancePolicy).HasColumnName("insurance_policy");
                entity.Property(e => e.PurchaseDate).HasColumnName("purchase_date");
                entity.Property(e => e.PurchasePrice).HasColumnName("purchase_price");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                // One-to-many relationship: A Vehicle has one CurrentDriver, a Driver can have many Vehicles.
                entity.HasOne(v => v.CurrentDriver)
               .WithMany(d => d.Vehicles)
               .HasForeignKey(v => v.CurrentDriverId);

                // One-to-many relationship: A Vehicle has many MaintenanceRecords.
                entity.HasMany(v => v.MaintenanceRecords)
               .WithOne(m => m.Vehicle)
               .HasForeignKey(m => m.VehicleId);
            });

            // 🔹 Relationships for Driver
            modelBuilder.Entity<Driver>(entity =>
            {
                entity.ToTable("drivers");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.LicenseNumber).HasColumnName("license_number");
                entity.Property(e => e.ExperienceYears).HasColumnName("experience_years");
                entity.Property(e => e.SafetyRating).HasColumnName("safety_rating");

                // One-to-many relationship: A Driver has many AttendanceRecords.
                entity.HasMany(d => d.AttendanceRecords)
               .WithOne(a => a.Driver)
               .HasForeignKey(a => a.DriverId);

                // One-to-many relationship: A Driver has many LeaveRequests.
                entity.HasMany(d => d.LeaveRequests)
               .WithOne(l => l.Driver)
               .HasForeignKey(l => l.DriverId);
            });

            // 🔹 Relationships for Route
            modelBuilder.Entity<Route>(entity =>
            {
                entity.ToTable("routes");
                entity.HasMany(r => r.Stops)
                    .WithOne(rs => rs.Route)
                    .HasForeignKey(rs => rs.RouteId);
            });

            // 🔹 Explicit column name mapping and relationships for MaintenanceRecord entity
            modelBuilder.Entity<MaintenanceRecord>(entity =>
            {
                entity.ToTable("maintenance_records");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.VehicleId).HasColumnName("vehicle_id");
                entity.Property(e => e.MaintenanceDate).HasColumnName("maintenance_date");
                entity.Property(e => e.Type).HasColumnName("type");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.Cost).HasColumnName("cost");
                entity.Property(e => e.VehiclePlate).HasColumnName("vehicle_plate");
                entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>(); // FIX: Changed from int to string
                entity.Property(e => e.Date).HasColumnName("date");
                entity.Property(e => e.PerformedBy).HasColumnName("performed_by");
                entity.Property(e => e.DueDate).HasColumnName("due_date");
                entity.Property(e => e.NextDueDate).HasColumnName("next_due_date");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            });

            // 🔹 One-to-one relationship between Route and RouteOptimization
            modelBuilder.Entity<RouteOptimization>()
           .HasOne(ro => ro.Route)
           .WithOne(r => r.Optimization)
           .HasForeignKey<RouteOptimization>(ro => ro.RouteId);

            // 🔹 One-to-many relationship between RouteOptimization and User
            modelBuilder.Entity<RouteOptimization>()
           .HasOne(ro => ro.OptimizedByUser)
           .WithMany()
           .HasForeignKey(ro => ro.OptimizedBy);

            var vehicleStatusConverter = new ValueConverter<VehicleStatus, string>(
                v => v.ToString(), // enum -> db
                v => (VehicleStatus)Enum.Parse(typeof(VehicleStatus), v.Replace(" ", ""))
            );

            modelBuilder.Entity<Vehicle>(entity =>
            {
                entity.ToTable("vehicles");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Status)
                    .HasColumnName("status")
                    .HasConversion(vehicleStatusConverter);
            });
        }
     }
}
