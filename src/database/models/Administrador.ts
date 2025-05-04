import { 
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Column
} from "typeorm";
import { Conta } from "./Conta";

@Entity("administrador", { schema: "db_pepvagas" })
export class Administrador {

  @PrimaryColumn()
  idconta: number;

  @Column("varchar", { name: "nome", length: 60 })
  nome: string;

  /*
  @Column("int", { name: "updateBy", nullable: true })
  updateBy: number | null;

  @Column("timestamp", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date | null;

  @Column("timestamp", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date | null;
  */

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => Conta)
  @JoinColumn({ name: "idconta" })
  conta: Conta
}