import { Request, Response } from "express"
import { z } from "zod"
import * as bcrypt from "bcrypt"
import { AppDataSource } from "../database/data-source"
import { Conta } from "../database/models/Conta"
import jwt from "jsonwebtoken";
import { Equal } from "typeorm"


export default {

    // FUNÇÃO PARA REALIZAR LOGIN
    async login(request: Request, response: Response) {

        const { email, senha, isInApp } = request.body

        const contaSchema = z.object({
            email: z.string().email(),
            senha: z.string().min(4),
            isInApp: z.boolean()
        });

        try {

            contaSchema.parse(request.body)

            const contaRepository = AppDataSource.getRepository(Conta)



            const conta = isInApp ? await contaRepository.findOne({
                where: {
                    email,
                    tipo: Equal("C")
                }
            }) : await contaRepository.findOne({
                where: {
                    email,
                }
            })

            if (conta) {

                const senhaExist = await bcrypt.compare(senha, conta.senha)

                if (senhaExist) {

                    const token = jwt.sign({ id: conta.idConta, tipo: conta.tipo }, '@$%_+POIUYTREWQASDF@@' as string, {
                        expiresIn: '5h',
                    });


                    const responseObject = {
                        id: conta.idConta,
                        token: token,
                        tipo: conta.tipo
                    }

                    return response.status(200).json(responseObject)
                } else {



                    return response.status(404).json({
                        message: "Email ou senha incorretos."
                    })

                }

            } else {

                // Essa conta existe (mesmo apagada)?

                const contaDeletedExist = isInApp ? await contaRepository.findOne({
                    where: {
                        email,
                        tipo: Equal("C")
                    },
                    withDeleted: true
                }) : await contaRepository.findOne({
                    where: {
                        email,
                    },
                    withDeleted: true
                })

                if (contaDeletedExist) {
                    return response.status(404).json({
                        message: "Não existe uma conta com este email."
                    });                

                } else {
                    return response.status(404).json({
                        message: "Não existe uma conta com este email."
                    });
                }
            }

        } catch (error: any) {
            let errors: string[] = [];
            error.issues.forEach((issue: any) => {
                errors.push(issue.message)
            });

            return response.status(400).json({
                messages: errors
            })
        }

    },

}