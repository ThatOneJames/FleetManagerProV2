using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("route_stops")]
    public class RouteStop
    {
        [Key]
        [Column("id")]
        [StringLength(128)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("route_id")]
        [StringLength(50)]
        public string RouteId { get; set; } = string.Empty;

        [Required]
        [Column("stop_order")]
        public int StopOrder { get; set; }

        [Required]
        [Column("address")]
        public string Address { get; set; } = string.Empty;

        [Column("latitude")]
        public decimal? Latitude { get; set; }

        [Column("longitude")]
        public decimal? Longitude { get; set; }

        [Column("estimated_arrival")]
        public DateTime? EstimatedArrival { get; set; }

        [Column("actual_arrival")]
        public DateTime? ActualArrival { get; set; }

        [Column("estimated_departure")]
        public DateTime? EstimatedDeparture { get; set; }

        [Column("actual_departure")]
        public DateTime? ActualDeparture { get; set; }

        [Required]
        [Column("priority")]
        [StringLength(20)]
        public string Priority { get; set; } = "normal";

        [Required]
        [Column("status")]
        [StringLength(20)]
        public string Status { get; set; } = "pending";

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("contact_name")]
        [StringLength(100)]
        public string? ContactName { get; set; }

        [Column("contact_phone")]
        [StringLength(20)]
        public string? ContactPhone { get; set; }

        [ForeignKey("RouteId")]
        public Route? Route { get; set; }
    }
}