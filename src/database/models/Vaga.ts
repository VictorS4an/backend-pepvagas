import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Area } from "./Area";
import { Candidato } from "./Candidato";
import { Conta } from "./Conta";
import { Empresa } from "./Empresa";

@Entity("vaga", { schema: "db_pepvagas" })
export class Vaga {
  @PrimaryGeneratedColumn({ type: "int", name: "idVaga" })
  idVaga: number;

  @Column("varchar", { name: "tipo_vaga", length: 20 })
  tipo: string;

  @Column("varchar", { name: "regime", length: 20 })
  regime: string;

  @Column("char", { name: "modalidade", length: 1})
  modalidade: string;

  @Column("varchar", { name: "titulo", length: 70 })
  titulo: string;

  @Column("text", { name: "descricao" })
  descricao: string;

  @Column("decimal", { name: "salario", precision: 8, scale: 2 })
  salario: number;

  @Column("tinyint", {
    name: "pcd",
    width: 1,
    default: () => "'0'",
  })
  pcd: boolean;

  @Column("date", { name: "data_limite", nullable: true })
  dataLimite: Date;

  @Column("varchar", { name: "cidade", length: 50 })
  cidade: string;
  
  @Column("varchar", { name: "nivel_de_instrucao", length: 40, nullable: true })
  nivelInstrucao: string | null;

  @Column("text", { name: "logo", nullable: true })
  logo: string | null;

  @Column("text", { name: "banner", nullable: true })
  banner: string | null;

  @Column("varchar", { name: "email_curriculo", nullable: true, length: 50 })
  emailCurriculo: string | null;

  @Column("varchar", { name: "site", nullable: true, length: 45 })
  site: string | null;

  @Column("char", { name: "ocultar_nome", length: 1, default: 'N' })
  ocultarNome: string;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;
  
  @ManyToOne(() => Conta, (conta) => conta.vagas, {
    onDelete: "NO ACTION",
  })
  @JoinColumn([{ name: "idConta", referencedColumnName: "idConta" }])
  conta: Conta;

  @ManyToOne(() => Area, (area) => area.vagas, {
    onDelete: "NO ACTION",
  })
  @JoinColumn([{ name: "idArea", referencedColumnName: "idArea" }])
  idArea: Area;

  @ManyToMany(() => Candidato, (candidato) => candidato.vagas)
  candidatos: Candidato[];

  @ManyToOne(() => Empresa, (empresa) => empresa.vagas, {
    onDelete: "NO ACTION",
  })
  @JoinColumn([{ name: "idEmpresa", referencedColumnName: "idconta" }])
  idEmpresa: Empresa;
}