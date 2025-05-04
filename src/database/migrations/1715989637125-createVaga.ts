import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateVaga1715989637125 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "vaga",
            columns: [
                { name: "idVaga", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                { name: "tipo_vaga", type: "varchar", length: "20", isNullable: false },
                { name: "regime", type: "varchar", length: "20", isNullable: false },
                { name: "modalidade", type: "char", length: "1", isNullable: false },
                { name: "titulo", type: "varchar", length: "70", isNullable: false },
                { name: "descricao", type: "text", isNullable: false },
                { name: "salario", type: "decimal", precision: 8, scale: 2, isNullable: false },
                { name: "pcd", type: "tinyint", isNullable: false },
                { name: "data_limite", type: "date", isNullable: false },
                { name: "cidade", type: "varchar", length: "50", isNullable: false },
                { name: "nivel_de_instrucao", type: "varchar", length:"40", isNullable: true },
                { name: "logo", type: "text", isNullable: true },
                { name: "banner", type: "text", isNullable: true },
                { name: "email_curriculo", type: "varchar", length: "45", isNullable: true },
                { name: "site", type: "varchar", length: "45", isNullable: true },
                { name: "deletedAt", type: "timestamp", isNullable: true },
                { name: "idArea", type: "int", isNullable: false },
                { name: "idConta", type: "int", isNullable: false },
                { name: "idEmpresa", type: "int", isNullable: false },
                { name: "ocultar_nome", type: "char", length: "1", isNullable: false, default: "'N'" }
            ]
        }), true);

        
        await queryRunner.query(`
        CREATE TRIGGER tr_delete_vaga
        BEFORE UPDATE ON vaga
        FOR EACH ROW
        BEGIN
            IF NEW.data_limite < NOW() THEN
                SET NEW.deletedAt = NOW();
                SET NEW.data_limite = NULL;
                -- SET NEW.idAdministradorExcluiu = NEW.idAdministrador;
                -- Adicione outros campos relacionados conforme necessário
            END IF;
        END;
        `);

        // Trigger pra por a logo e o banner padrao se for nulo
        await queryRunner.query(`
        CREATE TRIGGER tr_set_default_images BEFORE INSERT ON vaga
        FOR EACH ROW
        BEGIN
            -- Apenas define a logo padrão se a logo for NULL ou vazia
            IF NEW.logo IS NULL OR NEW.logo = '' THEN
                SET NEW.logo = 'vaga-logopadrao.svg';
            END IF;

            -- Apenas define o banner padrão se o banner for NULL ou vazio
            IF NEW.banner IS NULL OR NEW.banner = '' THEN
                SET NEW.banner = 'vaga-bannerpadrao.svg';
            END IF;
        END;

        `);
        

        await queryRunner.createForeignKey("vaga", new TableForeignKey({
            columnNames: ["idArea"],
            referencedColumnNames: ["idArea"],
            referencedTableName: "area",
            onDelete: "NO ACTION",
            onUpdate: "NO ACTION"
        }));

        await queryRunner.createForeignKey("vaga", new TableForeignKey({
            columnNames: ["idConta"],
            referencedColumnNames: ["idConta"],
            referencedTableName: "conta",
            onDelete: "NO ACTION",
            onUpdate: "NO ACTION"
        }));

        await queryRunner.createForeignKey("vaga", new TableForeignKey({
            columnNames: ["idEmpresa"],
            referencedColumnNames: ["idconta"],
            referencedTableName: "empresa",
            onDelete: "NO ACTION",
            onUpdate: "NO ACTION"
        }));

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("vaga", "idArea");
        await queryRunner.dropForeignKey("vaga", "idConta");
        await queryRunner.dropForeignKey("vaga", "idEmpresa");

        await queryRunner.dropColumn("vaga", "idArea");
        await queryRunner.dropColumn("vaga", "idConta");
        await queryRunner.dropColumn("vaga", "idEmpresa");

        await queryRunner.dropTable("vaga");
    }

}