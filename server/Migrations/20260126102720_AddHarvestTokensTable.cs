using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fortedle.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddHarvestTokensTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<List<string>>(
                name: "teams",
                table: "employees",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>(),
                oldClrType: typeof(List<string>),
                oldType: "text[]",
                oldDefaultValue: new List<string>());

            migrationBuilder.AlterColumn<List<string>>(
                name: "interests",
                table: "employees",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>(),
                oldClrType: typeof(List<string>),
                oldType: "text[]",
                oldDefaultValue: new List<string>());

            migrationBuilder.CreateTable(
                name: "harvest_tokens",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    access_token = table.Column<string>(type: "text", nullable: false),
                    refresh_token = table.Column<string>(type: "text", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    account_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_harvest_tokens", x => x.user_id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_harvest_tokens_updated_at",
                table: "harvest_tokens",
                column: "updated_at");

            migrationBuilder.CreateIndex(
                name: "idx_harvest_tokens_user_id",
                table: "harvest_tokens",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "harvest_tokens");

            migrationBuilder.AlterColumn<List<string>>(
                name: "teams",
                table: "employees",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>(),
                oldClrType: typeof(List<string>),
                oldType: "text[]",
                oldDefaultValue: new List<string>());

            migrationBuilder.AlterColumn<List<string>>(
                name: "interests",
                table: "employees",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>(),
                oldClrType: typeof(List<string>),
                oldType: "text[]",
                oldDefaultValue: new List<string>());
        }
    }
}
