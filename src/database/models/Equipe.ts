import { Column, DeleteDateColumn, Entity, OneToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Conta } from "./Conta";

@Entity("equipe", { schema: "db_pepvagas" })
export class Equipe {
  
  @PrimaryColumn({ type: "int", name: "idconta" })
  idconta: number;

  @Column("varchar", { name: "nome", length: 60 })
  nome: string;

  @OneToOne(() => Conta)
    @JoinColumn({ name: "idconta" })
    conta: Conta;
  
  @DeleteDateColumn({ name: "deletedAt" })
  deletedAt?: Date | null;
}
