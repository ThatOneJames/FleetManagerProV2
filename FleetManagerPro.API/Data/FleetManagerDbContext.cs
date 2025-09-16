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

        // 🔹 DbSets (tables)
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
                .WithOne(d => d.CurrentVehicle)  // assuming Driver has CurrentVehicle navigation property
                .HasForeignKey(d => d.CurrentVehicleId);

            modelBuilder.Entity<Vehicle>()
                .HasMany(v => v.MaintenanceRecords)
                .WithOne(m => m.Vehicle)
                .HasForeignKey(m => m.VehicleId);
        }
    }
}
