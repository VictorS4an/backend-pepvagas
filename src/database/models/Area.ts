import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Vaga } from "./Vaga";
import { Candidato } from "./Candidato";
import { join } from "path";

@Entity("area", { schema: "db_pepvagas" })
export class Area {
  @PrimaryGeneratedColumn({ type: "int", name: "idArea" })
  idArea: number;

  @Column("varchar", { name: "nome", length: 60 })
  nome: string;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
    deletedAt: Date | null;

  @ManyToMany(() => Candidato, (candidato) => candidato.areas)
  candidatos: Candidato[];

  @OneToMany(() => Vaga, (vaga) => vaga.idArea)
  vagas: Vaga[];
}