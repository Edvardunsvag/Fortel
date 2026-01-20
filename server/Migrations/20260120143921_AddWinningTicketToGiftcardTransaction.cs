using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fortedle.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddWinningTicketToGiftcardTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "monthly_winning_ticket_id",
                table: "giftcard_transactions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "winning_ticket_id",
                table: "giftcard_transactions",
                type: "integer",
                nullable: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_giftcard_transactions_monthly_winning_ticket_id",
                table: "giftcard_transactions",
                column: "monthly_winning_ticket_id");

            migrationBuilder.CreateIndex(
                name: "IX_giftcard_transactions_winning_ticket_id",
                table: "giftcard_transactions",
                column: "winning_ticket_id");

            migrationBuilder.AddForeignKey(
                name: "FK_giftcard_transactions_monthly_winning_tickets_monthly_winni~",
                table: "giftcard_transactions",
                column: "monthly_winning_ticket_id",
                principalTable: "monthly_winning_tickets",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_giftcard_transactions_winning_tickets_winning_ticket_id",
                table: "giftcard_transactions",
                column: "winning_ticket_id",
                principalTable: "winning_tickets",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_giftcard_transactions_monthly_winning_tickets_monthly_winni~",
                table: "giftcard_transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_giftcard_transactions_winning_tickets_winning_ticket_id",
                table: "giftcard_transactions");

            migrationBuilder.DropIndex(
                name: "IX_giftcard_transactions_monthly_winning_ticket_id",
                table: "giftcard_transactions");

            migrationBuilder.DropIndex(
                name: "IX_giftcard_transactions_winning_ticket_id",
                table: "giftcard_transactions");

            migrationBuilder.DropColumn(
                name: "monthly_winning_ticket_id",
                table: "giftcard_transactions");

            migrationBuilder.DropColumn(
                name: "winning_ticket_id",
                table: "giftcard_transactions");

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
