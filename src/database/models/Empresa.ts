import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Representante } from "./Representante";
import { Conta } from "./Conta";
import { Vaga } from "./Vaga";

//@Index("idArea", ["idArea"], {})
@Entity("empresa", { schema: "db_pepvagas" })
export class Empresa {
  
  @PrimaryColumn()
  idconta: number;

  @OneToOne(() => Conta)
  @JoinColumn({ name: "idconta"})
  conta: Conta

  @Column("varchar", { name: "nome_empresa", length: 60 })
  nomeEmpresa: string;

  @Column("varchar", { name: "cnpj", length: 14 })
  cnpj: string;

  @Column("varchar", { name: "site", nullable: true, length: 45 })
  site: string | null;

  @Column("varchar", { name: "telefone", nullable: true, length: 11 })
  telefone: string | null;

  @Column("varchar", { name: "email", length: 50 })
  email: string;

  @OneToMany(() => Representante, (representante) => representante.idEmpresa)
  representantes: Representante[];

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Vaga, (vaga) => vaga.idEmpresa)
  vagas: Vaga[];
}