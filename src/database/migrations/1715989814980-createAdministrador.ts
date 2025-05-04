import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";
import * as bcrypt from "bcrypt";

export class CreateAdministrador1715989814980 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "administrador",
            columns: [
                { name: "idconta", type: "int", isPrimary: true },
                { name: "deletedAt", type: "timestamp", isNullable: true },
                { name: "nome", type: "varchar", length: "60", isNullable: false }
            ],
        }));

        await queryRunner.createForeignKey("administrador", new TableForeignKey({
            columnNames: ["idconta"],
            referencedTableName: "conta",
            referencedColumnNames: ["idconta"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        }));

        const senhaCriptografada = await bcrypt.hash("1234", 10);

        await queryRunner.query(`
            INSERT INTO conta (email, senha, tipo)
            VALUES ('admin@admin.com', '${senhaCriptografada}', 'A')
        `);

        const [result] = await queryRunner.query(`
            SELECT idconta FROM conta WHERE email = 'admin@admin.com'
        `);

        const idconta = result?.idconta;

        if (idconta) {
            await queryRunner.query(`
                INSERT INTO administrador (idconta, nome)
                VALUES (${idconta}, 'Administrador')
            `);
        }
    }
    
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("administrador");
    }
}
