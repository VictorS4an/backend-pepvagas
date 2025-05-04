import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateRepresentante1715989737728 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "representante",
            columns: [
                { name: "idconta", type: "int", isPrimary: true, isNullable: false },
                { name: "nome", type: "varchar", length: "45", isNullable: false },
                { name: "deletedAt", type: "timestamp", isNullable: true },
                { name: "empresa", type: "int", isNullable: false }
            ],
            foreignKeys: [
                { columnNames: ["idconta"], referencedTableName: "conta", referencedColumnNames: ["idconta"], onDelete: "CASCADE"},
                { columnNames: ["empresa"], referencedTableName: "empresa", referencedColumnNames: ["idconta"], onDelete: "NO ACTION", onUpdate: "NO ACTION"}
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("representante");
    }

}
