import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class CreateEquipe1711520846212 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "equipe",
            columns: [
                { name: "idconta", type: "int", isPrimary: true, isNullable: false },
                { name: "nome", type: "varchar", length: "60", isNullable: false },
                { name: "deletedAt", type: "timestamp", isNullable: true }
            ],
            foreignKeys: [
                {
                    columnNames: ["idconta"], referencedTableName: "conta", referencedColumnNames: ["idconta"], onDelete: "CASCADE"
                }
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("equipe");
    }

}
