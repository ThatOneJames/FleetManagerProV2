using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("driver_warnings")]
    public class DriverWarning
    {
        [Key]
        public string Id { get; set; }

        [Required]
        public string DriverId { get; set; }

        [Required]
        public string Reason { get; set; }

        [Required]
        public string IssuedBy { get; set; }

        public DateTime DateIssued { get; set; } = DateTime.UtcNow;
    }
}
