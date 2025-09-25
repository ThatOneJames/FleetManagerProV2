using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FleetManagerPro.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUserId1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId1",
                table: "vehicles",
                type: "varchar(255)",
                nullable: true);
        }

    }
}
