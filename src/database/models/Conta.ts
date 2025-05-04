import { Column, DeleteDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { TipoUsuario } from "../../../../shared/enums/TipoUsuario";
import { Candidato } from "./Candidato";
import { Vaga } from "./Vaga";

@Entity("conta", { schema: "db_pepvagas" })
export class Conta {
    @PrimaryGeneratedColumn({type: "int", name: "idconta"})
    idConta: number

    @Column("varchar", { name: "email", length: 50 })
    email: string
    
    @Column("text", { name: "senha"})
    senha: string

    @DeleteDateColumn({ name: "deletedAt", nullable: true })
    deletedAt: Date | null;

    @Column("char", { name: "tipo"})
    tipo: string

    @OneToMany(() => Vaga, (vaga) => vaga.conta)
    vagas: Vaga[];

}