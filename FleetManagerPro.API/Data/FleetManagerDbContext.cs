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
        public DbSet<MaintenanceTask> MaintenanceTasks { get; set; } = null!;
        public DbSet<MaintenanceCategory> MaintenanceCategories { get; set; } = null!;
        public DbSet<MaintenanceReminder> MaintenanceReminders { get; set; } = null!;
        public DbSet<PreTripInspection> PreTripInspections { get; set; } = null!;
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<NotificationRule> NotificationRules { get; set; } = null!;
        public DbSet<DriverWarning> DriverWarnings { get; set; }
        public DbSet<DriverSuspension> DriverSuspensionHistory { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }



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

            // RouteOptimization entity
            modelBuilder.Entity<RouteOptimization>(entity =>
            {
                entity.ToTable("route_optimizations");
                entity.HasOne(ro => ro.Route)
                      .WithOne(r => r.Optimization)
                      .HasForeignKey<RouteOptimization>(ro => ro.RouteId);

                entity.HasOne(ro => ro.OptimizedByUser)
                      .WithMany()
                      .HasForeignKey(ro => ro.OptimizedBy);
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

            modelBuilder.Entity<MaintenanceTask>(entity =>
            {
                entity.ToTable("maintenance_tasks");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.VehicleId).HasColumnName("vehicle_id");
                entity.Property(e => e.CategoryId).HasColumnName("category_id");
                entity.Property(e => e.TaskType).HasColumnName("task_type");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.Priority).HasColumnName("priority");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.ScheduledDate).HasColumnName("scheduled_date");
                entity.Property(e => e.CompletedDate).HasColumnName("completed_date");
                entity.Property(e => e.ScheduledMileage).HasColumnName("scheduled_mileage").HasPrecision(10, 2);
                entity.Property(e => e.CompletedMileage).HasColumnName("completed_mileage").HasPrecision(10, 2);
                entity.Property(e => e.EstimatedCost).HasColumnName("estimated_cost").HasPrecision(10, 2);
                entity.Property(e => e.ActualCost).HasColumnName("actual_cost").HasPrecision(10, 2);
                entity.Property(e => e.AssignedTo).HasColumnName("assigned_to");
                entity.Property(e => e.TechnicianNotes).HasColumnName("technician_notes");
                entity.Property(e => e.PartsUsed).HasColumnName("parts_used");
                entity.Property(e => e.LaborHours).HasColumnName("labor_hours").HasPrecision(4, 2);
                entity.Property(e => e.ServiceProvider).HasColumnName("service_provider");
                entity.Property(e => e.WarrantyUntil).HasColumnName("warranty_until");
                entity.Property(e => e.CreatedBy).HasColumnName("created_by");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(t => t.Vehicle)
                      .WithMany()
                      .HasForeignKey(t => t.VehicleId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.Category)
                      .WithMany(c => c.MaintenanceTasks)
                      .HasForeignKey(t => t.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.Creator)
                      .WithMany()
                      .HasForeignKey(t => t.CreatedBy)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                entity.HasIndex(t => t.VehicleId);
                entity.HasIndex(t => t.Status);
                entity.HasIndex(t => t.ScheduledDate);
                entity.HasIndex(t => t.Priority);
            });

            modelBuilder.Entity<MaintenanceCategory>(entity =>
            {
                entity.ToTable("maintenance_categories");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.Description).HasColumnName("description");
                entity.Property(e => e.DefaultIntervalMiles).HasColumnName("default_interval_miles");
                entity.Property(e => e.DefaultIntervalMonths).HasColumnName("default_interval_months");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");

                entity.HasIndex(e => e.Name).IsUnique();
            });

            modelBuilder.Entity<MaintenanceReminder>(entity =>
            {
                entity.ToTable("maintenance_reminders");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.VehicleId).HasColumnName("vehicle_id");
                entity.Property(e => e.CategoryId).HasColumnName("category_id");
                entity.Property(e => e.ReminderType).HasColumnName("reminder_type");
                entity.Property(e => e.NextServiceMiles).HasColumnName("next_service_miles").HasPrecision(10, 2);
                entity.Property(e => e.NextServiceDate).HasColumnName("next_service_date");
                entity.Property(e => e.IntervalMiles).HasColumnName("interval_miles");
                entity.Property(e => e.IntervalMonths).HasColumnName("interval_months");
                entity.Property(e => e.LastServiceDate).HasColumnName("last_service_date");
                entity.Property(e => e.LastServiceMiles).HasColumnName("last_service_miles").HasPrecision(10, 2);
                entity.Property(e => e.IsActive).HasColumnName("is_active");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(r => r.Vehicle)
                      .WithMany()
                      .HasForeignKey(r => r.VehicleId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Category)
                      .WithMany(c => c.MaintenanceReminders)
                      .HasForeignKey(r => r.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(r => r.VehicleId);
                entity.HasIndex(r => r.CategoryId);
                entity.HasIndex(r => r.IsActive);
            });

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

                entity.HasOne(a => a.Driver)
                      .WithMany()
                      .HasForeignKey(a => a.DriverId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Approver)
                      .WithMany()
                      .HasForeignKey(a => a.ApprovedBy)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                entity.HasIndex(a => new { a.DriverId, a.Date }).IsUnique();
                entity.HasIndex(a => a.Date);
                entity.HasIndex(a => a.Status);
            });

            modelBuilder.Entity<LeaveRequest>(entity =>
            {
                entity.ToTable("leave_requests");

                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.DriverId).HasColumnName("driver_id");
                entity.Property(e => e.LeaveTypeId).HasColumnName("leave_type_id");
                entity.Property(e => e.StartDate).HasColumnName("start_date");
                entity.Property(e => e.EndDate).HasColumnName("end_date");
                entity.Property(e => e.TotalDays).HasColumnName("total_days");
                entity.Property(e => e.Reason).HasColumnName("reason");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
                entity.Property(e => e.SubmittedDate).HasColumnName("submitted_date");
                entity.Property(e => e.ApprovedBy).HasColumnName("approved_by");
                entity.Property(e => e.ApprovedAt).HasColumnName("approved_at");
                entity.Property(e => e.RejectionReason).HasColumnName("rejection_reason");
                entity.Property(e => e.EmergencyContact).HasColumnName("emergency_contact");
                entity.Property(e => e.SupportingDocuments).HasColumnName("supporting_documents");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                entity.HasOne(lr => lr.Driver)
                      .WithMany()
                      .HasForeignKey(lr => lr.DriverId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(lr => lr.ApproverUser)
                      .WithMany()
                      .HasForeignKey(lr => lr.ApprovedBy)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                entity.HasIndex(lr => lr.DriverId);
                entity.HasIndex(lr => lr.Status);
                entity.HasIndex(lr => lr.StartDate);
            });

            modelBuilder.Entity<PreTripInspection>(entity =>
            {
                entity.ToTable("PreTripInspections");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasMaxLength(128);
                entity.Property(e => e.RouteId).HasMaxLength(128).IsRequired();
                entity.Property(e => e.VehicleId).HasMaxLength(128).IsRequired();
                entity.Property(e => e.DriverId).HasMaxLength(128).IsRequired();
                entity.Property(e => e.MaintenanceRequestId).HasMaxLength(128);

                entity.HasOne(p => p.Route)
                      .WithMany()
                      .HasForeignKey(p => p.RouteId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Vehicle)
                      .WithMany()
                      .HasForeignKey(p => p.VehicleId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Driver)
                      .WithMany()
                      .HasForeignKey(p => p.DriverId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(p => p.RouteId);
                entity.HasIndex(p => p.VehicleId);
                entity.HasIndex(p => p.DriverId);
            });

            modelBuilder.Entity<MaintenanceRequest>(entity =>
            {
                entity.ToTable("MaintenanceRequests");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id).HasMaxLength(128);
                entity.Property(e => e.VehicleId).HasMaxLength(128).IsRequired();
                entity.Property(e => e.DriverId).HasMaxLength(128).IsRequired();
                entity.Property(e => e.RouteId).HasMaxLength(128);
                entity.Property(e => e.InspectionId).HasMaxLength(128);
                entity.Property(e => e.IssueType).HasMaxLength(100).IsRequired();
                entity.Property(e => e.IssueSeverity).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Priority).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ReportedBy).HasMaxLength(200);
                entity.Property(e => e.AssignedMechanic).HasMaxLength(200);
                entity.Property(e => e.EstimatedCost).HasPrecision(18, 2);
                entity.Property(e => e.ActualCost).HasPrecision(18, 2);

                entity.HasOne(m => m.Vehicle)
                      .WithMany()
                      .HasForeignKey(m => m.VehicleId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Driver)
                      .WithMany()
                      .HasForeignKey(m => m.DriverId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Route)
                      .WithMany()
                      .HasForeignKey(m => m.RouteId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                entity.HasOne(m => m.Inspection)
                      .WithOne(i => i.MaintenanceRequest)
                      .HasForeignKey<MaintenanceRequest>(m => m.InspectionId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                entity.HasIndex(m => m.VehicleId);
                entity.HasIndex(m => m.DriverId);
                entity.HasIndex(m => m.Status);
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("notifications");
                entity.HasOne(n => n.User)
                      .WithMany()
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(n => n.UserId);
                entity.HasIndex(n => n.IsRead);
                entity.HasIndex(n => n.CreatedAt);
            });

            modelBuilder.Entity<NotificationRule>(entity =>
            {
                entity.ToTable("notification_rules");
                entity.HasIndex(r => r.TriggerType);
                entity.HasIndex(r => r.IsActive);
            });
        }
    }
}
