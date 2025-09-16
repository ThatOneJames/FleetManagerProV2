namespace FleetManagerPro.API.DTOs.Users
{
    public class CreateUserDto
    {
        public string Username { get; set; }
        public string Password { get; set; }  // hash later in service layer
        public string Role { get; set; }
    }
}
