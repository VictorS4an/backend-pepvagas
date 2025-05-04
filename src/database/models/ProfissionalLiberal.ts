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
import { TipoServico } from "./TipoServico";
import { Conta } from "./Conta";

@Entity("profissional_liberal", { schema: "db_pepvagas" })
export class ProfissionalLiberal {
  
  @PrimaryColumn()
  idconta: number

  @OneToOne(() => Conta)
  @JoinColumn({ name: "idconta" })
  conta: Conta

  @Column("varchar", { name: "nome", length: 60 })
  nome: string;

  @Column("varchar", { name: "nome_social", length: 60, nullable: true })
  nomeSocial: string;

  @Column("text", { name: "descricao" })
  descricao: string;

  @Column("text", { name: "arquivo_imagem", nullable: true })
  arquivoImagem: string | null;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt?: Date | null;

  @Column("varchar", {name: "telefone", length: 11})
  telefone:string

  @Column("varchar", {name: "email", length: 50})
  email: string

  @ManyToMany(
    () => TipoServico, (tipoServico) => tipoServico.profissionaisLiberais
  )
  @JoinTable(
    {
    name: "servico_profissional",
    joinColumns: [
      {
        name: "idconta",
        referencedColumnName: "idconta",
      },
    ],
    inverseJoinColumns: [
      { name: "idTipoServico", referencedColumnName: "idTipoServico" },
    ],
    schema: "db_pepvagas",
  }
  )
  tipoServicos: TipoServico[];
}
