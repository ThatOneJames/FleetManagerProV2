using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
	[Table("driver_suspension_history")]
	public class DriverSuspension
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

		[Column("date_suspended")]
		public DateTime DateSuspended { get; set; } = DateTime.UtcNow;

		[Column("auto_suspended")]
		public bool AutoSuspended { get; set; }
	}
}
