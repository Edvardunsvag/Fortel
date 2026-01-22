using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fortedle.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddGiftcardTransactions : Migration
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

            migrationBuilder.AddColumn<string>(
                name: "phone_number",
                table: "employees",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "giftcard_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    employee_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    employee_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    employee_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    amount = table.Column<int>(type: "integer", nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    glede_order_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    glede_gift_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    glede_gift_link = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    message = table.Column<string>(type: "text", nullable: true),
                    sender_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    winning_ticket_id = table.Column<int>(type: "integer", nullable: true),
                    monthly_winning_ticket_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_giftcard_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_giftcard_transactions_employees_user_id",
                        column: x => x.user_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_giftcard_transactions_monthly_winning_tickets_monthly_winni~",
                        column: x => x.monthly_winning_ticket_id,
                        principalTable: "monthly_winning_tickets",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_giftcard_transactions_winning_tickets_winning_ticket_id",
                        column: x => x.winning_ticket_id,
                        principalTable: "winning_tickets",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "idx_giftcard_transactions_created_at",
                table: "giftcard_transactions",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_giftcard_transactions_glede_order_id",
                table: "giftcard_transactions",
                column: "glede_order_id");

            migrationBuilder.CreateIndex(
                name: "idx_giftcard_transactions_reason",
                table: "giftcard_transactions",
                column: "reason");

            migrationBuilder.CreateIndex(
                name: "idx_giftcard_transactions_status",
                table: "giftcard_transactions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_giftcard_transactions_user_id",
                table: "giftcard_transactions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_giftcard_transactions_monthly_winning_ticket_id",
                table: "giftcard_transactions",
                column: "monthly_winning_ticket_id");

            migrationBuilder.CreateIndex(
                name: "IX_giftcard_transactions_winning_ticket_id",
                table: "giftcard_transactions",
                column: "winning_ticket_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "giftcard_transactions");

            migrationBuilder.DropColumn(
                name: "phone_number",
                table: "employees");

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
