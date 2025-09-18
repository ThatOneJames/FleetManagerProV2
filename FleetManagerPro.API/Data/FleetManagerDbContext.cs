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
        public DbSet<DriverAttendance> DriverAttendances { get; set; } = null!;
        public DbSet<LeaveRequest> LeaveRequests { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 🔹 Explicit column name mapping for User entity
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
                entity.Property(e => e.Role).HasColumnName("role");
                entity.Property(e => e.Status).HasColumnName("status")
                .HasConversion<int>();
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            });

            // 🔹 User ↔ Driver (1-to-1)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Driver)
                .WithOne(d => d.User)
                .HasForeignKey<Driver>(d => d.UserId);

            // 🔹 Driver ↔ Vehicle (many-to-1, optional current vehicle)
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.CurrentVehicle)
                .WithMany(v => v.AssignedDrivers)
                .HasForeignKey(d => d.CurrentVehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            // 🔹 Driver ↔ Attendance (1-to-many)
            modelBuilder.Entity<DriverAttendance>()
                .HasOne(a => a.Driver)
                .WithMany(d => d.AttendanceRecords)
                .HasForeignKey(a => a.DriverId);

            // 🔹 Driver ↔ LeaveRequests (1-to-many)
            modelBuilder.Entity<LeaveRequest>()
                .HasOne(l => l.Driver)
                .WithMany(d => d.LeaveRequests)
                .HasForeignKey(l => l.DriverId);

            // 🔹 Route ↔ RouteStops (1-to-many)
            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Route)
                .WithMany(r => r.Stops)
                .HasForeignKey(rs => rs.RouteId);

            // 🔹 Route ↔ RouteOptimization (1-to-1)
            modelBuilder.Entity<RouteOptimization>()
                .HasOne(ro => ro.Route)
                .WithOne(r => r.Optimization)
                .HasForeignKey<RouteOptimization>(ro => ro.RouteId);

            // 🔹 RouteOptimization ↔ User (OptimizedByUser)
            modelBuilder.Entity<RouteOptimization>()
                .HasOne(ro => ro.OptimizedByUser)
                .WithMany()
                .HasForeignKey(ro => ro.OptimizedBy);

            // 🔹 Vehicle ↔ MaintenanceRecords (1-to-many)
            modelBuilder.Entity<MaintenanceRecord>()
                .HasOne(m => m.Vehicle)
                .WithMany(v => v.MaintenanceRecords)
                .HasForeignKey(m => m.VehicleId);

            modelBuilder.Entity<Vehicle>()
                .HasMany(v => v.AssignedDrivers)
                .WithOne(d => d.CurrentVehicle)
                .HasForeignKey(d => d.CurrentVehicleId);

            modelBuilder.Entity<Vehicle>()
                .HasMany(v => v.MaintenanceRecords)
                .WithOne(m => m.Vehicle)
                .HasForeignKey(m => m.VehicleId);

            modelBuilder.Entity<User>()
                .Property(u => u.Role);

            modelBuilder.Entity<User>()
                .Property(u => u.Status);
        }
    }
}