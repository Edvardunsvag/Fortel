using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fortedle.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddWinningTicketsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "winning_tickets",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    lottery_ticket_id = table.Column<int>(type: "integer", nullable: false),
                    week = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_winning_tickets", x => x.id);
                    table.ForeignKey(
                        name: "FK_winning_tickets_lottery_tickets_lottery_ticket_id",
                        column: x => x.lottery_ticket_id,
                        principalTable: "lottery_tickets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_winning_tickets_user_id",
                table: "winning_tickets",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_winning_tickets_lottery_ticket_id",
                table: "winning_tickets",
                column: "lottery_ticket_id");

            migrationBuilder.CreateIndex(
                name: "idx_winning_tickets_week",
                table: "winning_tickets",
                column: "week");

            migrationBuilder.CreateIndex(
                name: "idx_winning_tickets_created_at",
                table: "winning_tickets",
                column: "created_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "winning_tickets");
        }
    }
}
