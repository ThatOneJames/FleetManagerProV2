using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data
{
    public class FleetManagerDbContext : DbContext
    {
        public FleetManagerDbContext(DbContextOptions<FleetManagerDbContext> options)
            : base(options)
        {
        }

        // Add your DbSets here (tables)
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<Route> Routes { get; set; }
        public DbSet<RouteStop> RouteStops { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Add relationships, constraints, etc. here if needed
        }
    }
}
