using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("maintenance_categories")]
    public class MaintenanceCategory
    {
        [Key]
        [Column("id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [Column("name")]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("default_interval_miles")]
        public int? DefaultIntervalMiles { get; set; }

        [Column("default_interval_months")]
        public int? DefaultIntervalMonths { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public virtual ICollection<MaintenanceTask> MaintenanceTasks { get; set; } = new List<MaintenanceTask>();
        public virtual ICollection<MaintenanceReminder> MaintenanceReminders { get; set; } = new List<MaintenanceReminder>();
    }
}