import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { Empresa } from "./Empresa";
import { Conta } from "./Conta";

@Entity("representante", { schema: "db_pepvagas" })
export class Representante {

  @PrimaryColumn({ type: "int", name: "idconta", nullable: false })
  idconta: number;

  @Column("varchar", { name: "nome", length: 60 })
  nome: string;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => Conta)
  @JoinColumn({ name: "idconta" })
  conta: Conta;

  @ManyToOne(() => Empresa, (empresa) => empresa.representantes, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn([{ name: "empresa", referencedColumnName: "idconta" }])
  idEmpresa: Empresa;

}
