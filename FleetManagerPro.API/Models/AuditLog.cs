using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("audit_log")]
    public class AuditLog
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("userId")]
        public string? UserId { get; set; }

        [Column("actionType")]
        [Required]
        [MaxLength(50)]
        public string ActionType { get; set; } = string.Empty;

        [Column("entityType")]
        [MaxLength(50)]
        public string? EntityType { get; set; }

        [Column("entityId")]
        [MaxLength(128)]
        public string? EntityId { get; set; }

        [Column("description")]
        [MaxLength(500)]
        public string? Description { get; set; }

        [Column("oldValue")]
        public string? OldValue { get; set; }

        [Column("newValue")]
        public string? NewValue { get; set; }

        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "SUCCESS";

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Column("IsCompressed")]
        public bool IsCompressed { get; set; } = false;

        [Column("CompressedDate")]
        public DateTime? CompressedDate { get; set; }

        // Navigation property
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
