import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateArea1711565897326 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "area",
            columns: [
                { name: "idArea", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                { name: "nome", type: "varchar", length: "60" },
                { name: "deletedAt", type: "timestamp", isNullable: true}
            ]
        }));
        
        await queryRunner.query(`
            INSERT INTO area (nome, deletedAt) VALUES 
            ('Administração, negócios e serviços', NULL),
            ('Artes e Design ', NULL),
            ('Ciências Biológicas e da Terra', NULL),
            ('Ciências Exatas e Informática', NULL),
            ('Ciências Sociais e Humanas', NULL),
            ('Comunicação e Informação', NULL),
            ('Engenharia e Produção', NULL),
            ('Saúde e Bem-Estar', NULL)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("area");
    }
}