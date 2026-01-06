using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fortedle.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "employees",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    first_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    surname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    avatar_image_url = table.Column<string>(type: "text", nullable: true),
                    department = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    office = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    teams = table.Column<List<string>>(type: "text[]", nullable: false, defaultValue: new List<string>()),
                    age = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    supervisor = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    funfact = table.Column<string>(type: "text", nullable: true),
                    interests = table.Column<List<string>>(type: "text[]", nullable: false, defaultValue: new List<string>()),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employees", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "leaderboard",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    player_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    avatar_image_url = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_leaderboard", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_employees_updated_at",
                table: "employees",
                column: "updated_at");

            migrationBuilder.CreateIndex(
                name: "idx_leaderboard_date",
                table: "leaderboard",
                column: "date");

            migrationBuilder.CreateIndex(
                name: "idx_leaderboard_date_score",
                table: "leaderboard",
                columns: new[] { "date", "score" });

            migrationBuilder.CreateIndex(
                name: "IX_leaderboard_player_name_date",
                table: "leaderboard",
                columns: new[] { "player_name", "date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "employees");

            migrationBuilder.DropTable(
                name: "leaderboard");
        }
    }
}
