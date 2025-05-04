import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateEmpresa1711566932585 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "empresa",
            columns: [
                { 
                    name: "idconta", 
                    type: "int", 
                    isPrimary: true 
                },
                { 
                    name: "nome_empresa", 
                    type: "varchar", 
                    length: "60", 
                    isNullable: false 
                },
                { 
                    name: "cnpj", 
                    type: "varchar", 
                    length: "14", 
                    isNullable: false,
                },
                { 
                    name: "site", 
                    type: "varchar", 
                    length: "45", 
                    isNullable: true 
                },
                { 
                    name: "telefone", 
                    type: "varchar", 
                    length: "11", 
                    isNullable: true 
                },
                { 
                    name: "email", 
                    type: "varchar", 
                    length: "50", 
                    isNullable: false,
                },
                { 
                    name: "deletedAt", 
                    type: "timestamp", 
                    isNullable: true 
                },
            ],
            foreignKeys: [
                new TableForeignKey({
                    columnNames: ["idconta"],
                    referencedTableName: "conta",
                    referencedColumnNames: ["idconta"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE"
                })
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("empresa");
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.includes("idconta"));
        
        if (foreignKey) {
            await queryRunner.dropForeignKey("empresa", foreignKey);
        }

        await queryRunner.dropTable("empresa");
    }
}
