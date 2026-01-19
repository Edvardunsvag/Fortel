using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fortedle.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeWeeksTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "employee_weeks",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    week_key = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    week_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    week_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    hours = table.Column<double>(type: "double precision", nullable: false),
                    billable_hours = table.Column<double>(type: "double precision", nullable: false),
                    is_lottery_eligible = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee_weeks", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_employee_weeks_user_id",
                table: "employee_weeks",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_employee_weeks_week_key",
                table: "employee_weeks",
                column: "week_key");

            migrationBuilder.CreateIndex(
                name: "idx_employee_weeks_week_start",
                table: "employee_weeks",
                column: "week_start");

            migrationBuilder.CreateIndex(
                name: "idx_employee_weeks_user_week",
                table: "employee_weeks",
                columns: new[] { "user_id", "week_key" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "employee_weeks");
        }
    }
}
