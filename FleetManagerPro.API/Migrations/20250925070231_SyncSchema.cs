using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FleetManagerPro.API.Migrations
{
    /// <inheritdoc />
    public partial class SyncSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 👇 Intentionally left blank
            // We already synced the schema manually in SQL.
            // This migration only exists to update EF’s snapshot.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 👇 Intentionally left blank
            // No rollback needed because no operations are applied.
        }
    }
}
