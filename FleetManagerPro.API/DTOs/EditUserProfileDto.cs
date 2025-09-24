namespace FleetManagerPro.API.DTOs.Users
{
	public class EditUserProfileDto
	{
        public string? Name { get; set; }               // new
        public string? Email { get; set; }              // new
        public string? Password { get; set; }           // new, optional
        public string? Phone { get; set; }
		public string? Address { get; set; }
		public DateTime? DateOfBirth { get; set; }
		public DateTime? HireDate { get; set; }   // maybe only admin should set this?
		public string? EmergencyContact { get; set; }
		public string? ProfileImageUrl { get; set; }
	}
}
