import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Vaga } from "./Vaga";
import { Area } from "./Area";
import { Conta } from "./Conta";

@Entity("candidato", { schema: "db_pepvagas" })
export class Candidato {

  @PrimaryColumn()
  idconta: number;

  @OneToOne(() => Conta)
  @JoinColumn({ name: "idconta" })
  conta: Conta

  @Column("varchar", { name: "nome", length: 60, nullable: false })
  nome: string;

  @Column("varchar", { name: "nome_social", length: 60, nullable: true })
  nomeSocial: string;

  @Column("varchar", { name: "genero", length: 20, nullable: false })
  genero: string;

  @Column("varchar", { name: "cpf", length: 14, nullable: false })
  cpf: string;

  @Column("date", { name: "data_nascimento", nullable: false })
  dataNascimento: string;

  @Column("tinyint", {
    name: "pcd",
    width: 1,
    default: () => "'0'",
    nullable: false
  })
  pcd: boolean;

  @Column("varchar", { name: "disponibilidade", length: 30, nullable: true })
  disponibilidade: string;

  @Column("varchar", { name: "cidade_interesse", length: 500, nullable: true })
  cidade: string;

  @Column("varchar", { name: "tipo_vaga_interesse", length: 20, nullable: true })
  tipoVaga: string;

  @Column("float", { name: "pretensao_salarial_interesse", precision: 8, nullable: true })
  pretensaoSalarial: number;

  @Column("varchar", { name: "nivel_de_instrucao", length: 40, nullable: true })
  nivelInstrucao: string;

  @Column("varchar", { name: "cnh", length: 2, nullable: true })
  cnh: string;

  @Column("varchar", { name: "telefone_para_contato", length: 11, nullable: true })
  telefone: string;

  @Column("text", { name: "token_firebase", nullable: true })
  tokenFirebase?: string;

  @Column("text", {name:"curriculo", nullable: true})
  curriculo: string | null;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt: Date | null;

  @ManyToMany(() => Vaga, (vaga) => vaga.candidatos)
  @JoinTable({
    name: "candidato_vaga",
  })
  vagas: Vaga[];

  @ManyToMany(() => Area, (area) => area.candidatos)
  @JoinTable({
    name: "candidato_area"
  })
  areas: Area[];

}