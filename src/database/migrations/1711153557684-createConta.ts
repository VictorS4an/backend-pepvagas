import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class CreateConta1711153557684 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.createTable(
            new Table({
                name: "conta",
                columns: [
                    {
                        name: "idconta",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "50",
                        isNullable: false
                    },
                    {
                        name: "senha",
                        type: "text",
                        isNullable: false
                    },
                    {
                        name: "tipo",
                        type: "char",
                        isNullable: false
                    },
                    { 
                        name: "deletedAt", 
                        type: "timestamp", 
                        isNullable: true 
                    }
                ]
            }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("conta");
    }

}
