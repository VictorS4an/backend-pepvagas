import { Column, DeleteDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProfissionalLiberal } from "./ProfissionalLiberal";

@Entity("tipo_servico", { schema: "db_pepvagas" })
export class TipoServico {
  @PrimaryGeneratedColumn({ type: "int", name: "idTipoServico" })
  idTipoServico: number;

  @Column("varchar", { name: "nome", length: 60 })
  nome: string;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt: Date | null;

  @ManyToMany(
    () => ProfissionalLiberal,
    (profissionalLiberal) => profissionalLiberal.tipoServicos
  )
  profissionaisLiberais: ProfissionalLiberal[];
}
