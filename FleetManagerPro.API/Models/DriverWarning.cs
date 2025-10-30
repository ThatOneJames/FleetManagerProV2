using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("driver_warnings")]
    public class DriverWarning
    {
        [Key]
        [Column("id")]
        public string Id { get; set; }

        [Required]
        [Column("driver_id")]
        public string DriverId { get; set; }

        [Required]
        [Column("reason")]
        public string Reason { get; set; }

        [Required]
        [Column("issued_by")]
        public string IssuedBy { get; set; }

        [Column("date_issued")]
        public DateTime DateIssued { get; set; } = DateTime.UtcNow;
    }
}
