using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Models;
using Route = FleetManagerPro.API.Models.Route;

namespace FleetManagerPro.API.Data
{
    public class FleetManagerDbContext : DbContext
    {
        public FleetManagerDbContext(DbContextOptions<FleetManagerDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Vehicle> Vehicles { get; set; } = null!;
        public DbSet<VehicleCategory> VehicleCategories { get; set; } = null!;
        public DbSet<Route> Routes { get; set; } = null!;
        public DbSet<RouteStop> RouteStops { get; set; } = null!;
        public DbSet<RouteOptimization> RouteOptimizations { get; set; } = null!;
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; } = null!;
        public DbSet<LeaveRequest> LeaveRequests { get; set; } = null!;
        public DbSet<DriverAttendance> DriverAttendances { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");

                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.Email).HasColumnName("email");
                entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
                entity.Property(e => e.Phone).HasColumnName("phone");
                entity.Property(e => e.Address).HasColumnName("address");
                entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
                entity.Property(e => e.EmergencyContact).HasColumnName("emergency_contact");
                entity.Property(e => e.HireDate).HasColumnName("hire_date");
                entity.Property(e => e.ProfileImageUrl).HasColumnName("profile_image_url");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
                entity.Property(e => e.Role).HasColumnName("role").HasConversion<string>();
                entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>();
            });

            // Vehicle entity
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
                entity.Property(e => e.FuelType).HasColumnName("fuel_type").HasConversion<string>();
                entity.Property(e => e.FuelCapacity).HasColumnName("fuel_capacity");
                entity.Property(e => e.CurrentMileage).HasColumnName("current_mileage");
                entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>();
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

                // Relationships
                entity.HasOne(v => v.CurrentDriver)
                       .WithMany()
                       .HasForeignKey(v => v.CurrentDriverId)
                       .IsRequired(false)
                       .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(v => v.Category)
                       .WithMany(c => c.Vehicles)
                       .HasForeignKey(v => v.CategoryId)
                       .IsRequired(true)
                       .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(v => v.MaintenanceRecords)
                        .WithOne(m => m.Vehicle)
                        .HasForeignKey(m => m.VehicleId)
                        .OnDelete(DeleteBehavior.Cascade);
            });

            // VehicleCategory entity
            modelBuilder.Entity<VehicleCategory>(entity =>
            {
                entity.ToTable("vehicle_categories");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            });

            // Route entity
            modelBuilder.Entity<Route>(entity =>
            {
                entity.ToTable("routes");
                entity.HasMany(r => r.Stops)
                      .WithOne(rs => rs.Route)
                      .HasForeignKey(rs => rs.RouteId);
            });

            // MaintenanceRecord entity
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
                entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>();
                entity.Property(e => e.PerformedBy).HasColumnName("performed_by");
                entity.Property(e => e.DueDate).HasColumnName("due_date");
                entity.Property(e => e.NextDueDate).HasColumnName("next_due_date");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            // DriverAttendance entity
            modelBuilder.Entity<DriverAttendance>(entity =>
            {
                entity.ToTable("attendance");

                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.DriverId).HasColumnName("driver_id").HasMaxLength(128);
                entity.Property(e => e.Date).HasColumnName("date");
                entity.Property(e => e.ClockIn).HasColumnName("clock_in");
                entity.Property(e => e.ClockOut).HasColumnName("clock_out");
                entity.Property(e => e.TotalHours).HasColumnName("total_hours").HasColumnType("decimal(4,2)");
                entity.Property(e => e.BreakDuration).HasColumnName("break_duration").HasColumnType("decimal(4,2)");
                entity.Property(e => e.OvertimeHours).HasColumnName("overtime_hours").HasColumnType("decimal(4,2)");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
                entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(255);
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.ApprovedBy).HasColumnName("approved_by").HasMaxLength(128);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                // Relationships
                entity.HasOne(a => a.Driver)
                      .WithMany()
                      .HasForeignKey(a => a.DriverId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Approver)
                      .WithMany()
                      .HasForeignKey(a => a.ApprovedBy)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                // Indexes
                entity.HasIndex(a => new { a.DriverId, a.Date }).IsUnique();
                entity.HasIndex(a => a.Date);
                entity.HasIndex(a => a.Status);
            });

            // RouteOptimization entity
            modelBuilder.Entity<RouteOptimization>()
                .HasOne(ro => ro.Route)
                .WithOne(r => r.Optimization)
                .HasForeignKey<RouteOptimization>(ro => ro.RouteId);

            modelBuilder.Entity<RouteOptimization>()
                .HasOne(ro => ro.OptimizedByUser)
                .WithMany()
                .HasForeignKey(ro => ro.OptimizedBy);

            // LeaveRequest entity
            modelBuilder.Entity<LeaveRequest>(entity =>
            {
                entity.ToTable("leave_requests");

                entity.HasOne(lr => lr.Driver)
                      .WithMany()
                      .HasForeignKey(lr => lr.DriverId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(lr => lr.ApproverUser)
                      .WithMany()
                      .HasForeignKey(lr => lr.ApprovedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Route-User Many-to-Many relationship
            modelBuilder.Entity<Route>()
                .HasMany(r => r.AssignedDrivers)
                .WithMany()
                .UsingEntity<Dictionary<string, object>>(
                    "route_users",
                    j => j.HasOne<User>()
                          .WithMany()
                          .HasForeignKey("user_id")
                          .HasPrincipalKey(u => u.Id)
                          .OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Route>()
                          .WithMany()
                          .HasForeignKey("route_id")
                          .HasPrincipalKey(r => r.Id)
                          .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.ToTable("route_users");
                        j.Property<string>("user_id").HasColumnName("user_id").HasColumnType("varchar(128)");
                        j.Property<string>("route_id").HasColumnName("route_id").HasColumnType("varchar(128)");
                        j.HasKey("route_id", "user_id");
                    });
        }
    }
}