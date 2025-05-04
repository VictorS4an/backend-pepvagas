import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTipoServico1698806680718 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "tipo_servico",
            columns: [
                {
                    name: "idTipoServico",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true, generationStrategy: "increment"
                },
                {
                    name: "nome",
                    type: "varchar",
                    length: "60"
                },
                {
                    name: "deletedAt",
                    type: "datetime",
                    isNullable: true
                }
            ]
        }), true);

        await queryRunner.query(`
            INSERT INTO tipo_servico (nome, deletedAt) VALUES 
            ('Administradores', NULL),
            ('Geólogos ', NULL),
            ('Advogados', NULL),
            ('Jornalistas', NULL),
            ('Agrônomos', NULL),
            ('Leiloeiros', NULL),
            ('Arquitetos', NULL),
            ('Médicos', NULL),
            ('Arquivistas', NULL),
            ('Médicos Veterinários', NULL),
            ('Artistas', NULL),
            ('Museólogos', NULL),
            ('Atores', NULL),
            ('Músicos', NULL),
            ('Atuários', NULL),
            ('Nutricionistas', NULL),
            ('Autores Teatrais', NULL),
            ('Oceanógrafos', NULL),
            ('Bacharéis Em Ciências Da Computação', NULL),
            ('Odontologistas', NULL),
            ('Bibliotecários', NULL),
            ('Parteiras', NULL),
            ('Biólogos', NULL),
            ('Professores (Particulares)', NULL),
            ('Biomédicos', NULL),
            ('Profissional De Tecnologia Da Informação (Ti)', NULL),
            ('Cenógrafos', NULL),
            ('Protéticos Dentários', NULL),
            ('Compositores Artísticos Musicais E Plásticos', NULL),
            ('Psicólogos', NULL),
            ('Contadores', NULL),
            ('Publicitários', NULL),
            ('Corretores De Imóveis', NULL),
            ('Químicos', NULL),
            ('Economistas', NULL),
            ('Relações Públicas', NULL),
            ('Educadores Físicos', NULL),
            ('Sociólogos', NULL),
            ('Enfermeiros', NULL),
            ('Técnico Em Informática', NULL),
            ('Engenheiros', NULL),
            ('Técnicos Agrícolas', NULL),
            ('Enólogos', NULL),
            ('Técnicos Em Contabilidade', NULL),
            ('Escritores', NULL),
            ('Técnicos Em Radiologia', NULL),
            ('Estatísticos', NULL),
            ('Técnicos Industriais', NULL),
            ('Farmacêuticos', NULL),
            ('Tecnólogos', NULL),
            ('Fisioterapeutas', NULL),
            ('Terapeutas Ocupacionais', NULL),
            ('Fonoaudiólogos', NULL),
            ('Tradutores', NULL),
            ('Fotógrafos', NULL),
            ('Zootecnistas', NULL)
        `);
    }

    

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("tipo_servico");
    }

}
