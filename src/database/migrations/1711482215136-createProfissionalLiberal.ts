import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateProfissionalLiberal1711482215136 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "profissional_liberal",
            columns: [
                { name: "idconta", type: "int", isPrimary: true },
                { name: "nome", type: "varchar", length: "60", isNullable: false },
                { name: "nome_social", type: "varchar", length: "60", isNullable: true },
                { name: "descricao", type: "text", isNullable: false },
                { name: "arquivo_imagem", type: "text", isNullable: true },
                { name: "telefone", type: "varchar", length: "20", isNullable: false },
                { name: "email", type: "varchar", length: "50", isNullable: false},
                { name: "deletedAt", type: "timestamp", isNullable: true },
            ],
        }));

        await queryRunner.createForeignKey("profissional_liberal", new TableForeignKey({
            columnNames: ["idconta"],
            referencedTableName: "conta",
            referencedColumnNames: ["idconta"],
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("profissional_liberal");
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.includes("idconta"));
        
        if (foreignKey) {
            await queryRunner.dropForeignKey("profissional_liberal", foreignKey);
        }

        await queryRunner.dropTable("profissional_liberal");
    }
}
