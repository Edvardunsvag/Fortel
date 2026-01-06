using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fortedle.Server.Migrations
{
    /// <inheritdoc />
    public partial class ChangeAgeToInteger : Migration
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

            // Change the column type from VARCHAR to INTEGER with explicit USING clause
            // This converts valid numeric strings to integers, and invalid values (like '-', empty, or non-numeric) to NULL
            migrationBuilder.Sql(@"
                ALTER TABLE employees 
                ALTER COLUMN age TYPE INTEGER 
                USING CASE 
                    WHEN age IS NULL OR age = '' OR age = '-' THEN NULL::INTEGER
                    WHEN age ~ '^[0-9]+$' THEN age::INTEGER
                    ELSE NULL::INTEGER
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            // Convert back to VARCHAR for rollback
            migrationBuilder.Sql(@"
                ALTER TABLE employees 
                ALTER COLUMN age TYPE character varying(50)
                USING CASE 
                    WHEN age IS NULL THEN NULL::character varying(50)
                    ELSE age::text
                END;
            ");
        }
    }
}
