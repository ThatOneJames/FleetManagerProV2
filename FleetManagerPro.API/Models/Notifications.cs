using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        [MaxLength(128)]
        public string? UserId { get; set; }

        [Required]
        [Column("title")]
        [MaxLength(255)]
        public string Title { get; set; } = "";

        [Required]
        [Column("message")]
        public string Message { get; set; } = "";

        [Required]
        [Column("type")]
        [MaxLength(20)]
        public string Type { get; set; } = "Info"; // Info, Warning, Success, Error

        [Required]
        [Column("category")]
        [MaxLength(50)]
        public string Category { get; set; } = ""; // Trip, Maintenance, Leave, System

        [Column("related_entity_type")]
        [MaxLength(50)]
        public string? RelatedEntityType { get; set; }

        [Column("related_entity_id")]
        [MaxLength(50)]
        public string? RelatedEntityId { get; set; }

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("is_sent")]
        public bool IsSent { get; set; } = false;

        [Column("send_email")]
        public bool SendEmail { get; set; } = false;

        [Column("send_sms")]
        public bool SendSms { get; set; } = false;

        [Column("scheduled_send_time")]
        public DateTime? ScheduledSendTime { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("read_at")]
        public DateTime? ReadAt { get; set; }

        // Navigation property
        public User? User { get; set; }
    }

    [Table("notification_rules")]
    public class NotificationRule
    {
        [Key]
        [Column("id")]
        [MaxLength(36)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("name")]
        [MaxLength(100)]
        public string Name { get; set; } = "";

        [Required]
        [Column("trigger_type")]
        [MaxLength(50)]
        public string TriggerType { get; set; } = ""; // TripAssigned, MaintenanceDue, LeaveApproved, etc.

        [Column("condition_text")]
        public string? ConditionText { get; set; }

        [Column("recipients")]
        [MaxLength(500)]
        public string? Recipients { get; set; } // Comma-separated user IDs or roles

        [Column("send_email")]
        public bool SendEmail { get; set; } = false;

        [Column("send_sms")]
        public bool SendSms { get; set; } = false;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("triggered_count")]
        public int TriggeredCount { get; set; } = 0;

        [Column("last_triggered")]
        public DateTime? LastTriggered { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}