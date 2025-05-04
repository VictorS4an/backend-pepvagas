import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreateCandidato1711566012627 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "candidato",
            columns: [
                { name: "idconta", type: "int", isPrimary: true },
                { name: "nome", type: "varchar", length: "60", isNullable: false },
                { name: "nome_social", type: "varchar", length: "60", isNullable: true },
                { name: "genero", type: "varchar", length: "20", isNullable: false },
                { name: "cpf", type: "varchar", length: "14", isNullable: false},
                { name: "data_nascimento", type: "date", isNullable: false },
                { name: "pcd", type: "tinyint", isNullable: false },
                { name: "disponibilidade", type: "varchar", length: "30", isNullable: true },
                { name: "cidade_interesse", type: "varchar", length: "500", isNullable: true },
                { name: "tipo_vaga_interesse", type: "varchar", length: "20", isNullable: true },
                { name: "pretensao_salarial_interesse", type: "decimal", precision: 8, scale: 2, isNullable: true },
                { name: "nivel_de_instrucao", type: "varchar", length: "40", isNullable: true },
                { name: "cnh", type: "varchar", length: "2", isNullable: true },
                { name: "telefone_para_contato", type: "varchar", length: "11", isNullable: true },
                { name: "token-firebase", type: "text", isNullable: true },
                { name: "curriculo", type: "text", isNullable: true },
                { name: "deletedAt", type: "timestamp", isNullable: true } 
            ]
        }));

        //  await queryRunner.query(`
        //            INSERT INTO candidato (nome, nome_social, genero, cpf, pretensao_salarial, cep, cidade, logradouro, numero, uf, disponibilidade, cnh, nivel_instrucao, data_nascimento, tipo_vaga_interesse, regiao_interesse, cep_interesse, cidade_interesse, uf_interesse, regime_interesse, modalidade_interesse, areas, curriculo, pcd)
        //              VALUES ('Candidato1', 'Candidato1', 'Masculino', 12345678901, 1000, 12345678, 'Cidade', 'Logradouro', '66-13', 'SP', 'Manha', 'A', 'Superior Completo', '2000-01-01', 'Informática', false, '88540000', 'Presidente Epitacio', 'SP', 'PJ', 'Remoto', 'Construção Civil', 'Curriculo', 'PCD')
        //          `);

        await queryRunner.createForeignKey("candidato", new TableForeignKey({
            columnNames: ["idconta"],
            referencedTableName: "conta",
            referencedColumnNames: ["idconta"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        }));

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("candidato");
    }
}
