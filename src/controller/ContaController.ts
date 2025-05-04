import { Request, Response } from "express"
import { AppDataSource } from "../database/data-source"
import { Conta } from "../database/models/Conta"
import { hash } from "bcrypt"
import { z } from "zod"
import * as bcrypt from "bcrypt";
import { generatePassword, sendEmail } from "./EmailController"
import { IsNull, Not } from "typeorm"


export default {

    // LISTA TODAS AS CONTAS EXISTENTES
    async index(request: Request, response: Response) {
        const contaRepository = AppDataSource.getRepository(Conta)

        const contas = await contaRepository.find({
            select: {
                idConta: true,
                email: true,
                tipo: true,
                deletedAt: true
            }
        })

        return response.status(206).json(contas)
    },

    // LISTA TODAS AS CONTAS, INCLUINDO AS EXCLUÍDAS
    async indexDeleted(request: Request, response: Response){
        const contaRepository = AppDataSource.getRepository(Conta)

        const contas = await contaRepository.find({
            select: {
                idConta: true,
                email: true,
                tipo: true,
                deletedAt: true
            },
            withDeleted: true
        })

        return response.status(206).json(contas)
    },

    // BUSCA UMA CONTA PELO ID
    async getById(request: Request, response: Response) {
        const { id } = request.params

        const zodSchema = z.object({
            id: z.string({
                required_error: "Id é requerido"
            })
        })

        try {
            zodSchema.parse(request.params)

            const contaRepository = AppDataSource.getRepository(Conta)

            const conta = await contaRepository.findOne({
                where: {
                    idConta: +id
                },
                select: {
                    idConta: true,
                    email: true,
                    tipo: true
                }
            })

            if (conta) {
                return response.status(206).json(conta)
            } else {
                return response.status(404).json({
                    message: "Conta não encontrada"
                })
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

    // BUSCA UMA CONTA PELO EMAIL
    async getByEmail(request: Request, response: Response){
        const { email } = request.params

        const zodSchema = z.object({
            email: z.string({
                invalid_type_error: "Email inválido.",
                required_error: "Email é requerido."
            }).email()
        })

        try {
            zodSchema.parse(request.params)

            const contaRepository = AppDataSource.getRepository(Conta)

            const conta = await contaRepository.findOne({
                where: {
                    email
                },
                select: {
                    idConta: true,
                    email: true,
                    tipo: true
                }
            })

            if (conta) {
                return response.status(206).json(conta)
            } else {
                return response.status(404).json({
                    message: "Conta não encontrada"
                })
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

    // CRIA UMA NOVA CONTA NO SISTEMA
    async create(request: Request, response: Response) {
        const { email, senha, tipo } = request.body

        const contaSchema = z.object({
            email: z.string({
                required_error: "Email é requerido",
                invalid_type_error: "Email precisa ser uma string"
            }).email({
                message: "Endereço de email inválido",
            }).min(1),
            senha: z.string({
                required_error: "Senha é requerida",
                invalid_type_error: "Senha precisa ser uma string"
            }).min(4),
            tipo: z.string({
                required_error: "Tipo é requerido",
                invalid_type_error: "Tipo precisa ser uma string"
            }).length(1)
        });

        try {
            contaSchema.parse(request.body)
            const contaRepository = AppDataSource.getRepository(Conta)

            const contaExist = await contaRepository.findOne({
                where: {
                    email,
                    deletedAt: IsNull()  
                }
            })

            if (contaExist) {
                return response.status(409).json({
                    message: "Já existe uma conta ativa com o email inserido!"
                })
            }

            const newConta = new Conta()
            newConta.email = email
            const hashSenha = await hash(senha, 10)
            newConta.senha = hashSenha
            newConta.tipo = tipo

            const conta = await contaRepository.save(newConta)

            return response.status(201).json({
                idConta: conta.idConta,
                message: "Conta criada com sucesso.",  
            })
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

    // ATUALIZA A SENHA DE UMA CONTA
    async updatePassword(request: Request, response: Response) {
        const { senhaAtual, novaSenha, confirmacaoNovaSenha } = request.body
        const { id } = request.params

        const senhasSchema = z.object({
            id: z.string({
                required_error: "Id é requerido"
            }),
            senhaAtual: z.string({
                required_error: "Senha atual é requerida",
            }).min(4),
            novaSenha: z.string({
                required_error: "Nova senha é requerida",
            }).min(4),
            confirmacaoNovaSenha: z.string({
                required_error: "Confirmação da senha é requerida",
            }).min(4)
        })

        try {

            senhasSchema.parse({
                id, senhaAtual, novaSenha, confirmacaoNovaSenha
            });

            const contaRepository = AppDataSource.getRepository(Conta);

            const conta = await contaRepository.findOne({
                where: {
                    idConta: +id
                }
            });

            if (conta) {

                if (novaSenha != confirmacaoNovaSenha) {
                    return response.status(400).json({
                        message: "A nova senha e sua confirmação devem ser iguais"
                    })
                }

                const senhaValida = await bcrypt.compare(senhaAtual, conta.senha)

                if (senhaValida) {

                    const hashNovaSenha = await bcrypt.hash(novaSenha, 10)

                    conta.senha = hashNovaSenha;

                    await contaRepository.save(conta)

                    return response.status(200).json({
                        message: "Senha atualizada com sucesso"
                    })
                } else {
                    return response.status(400).json({
                        message: "A senha atual inserida não condiz com a senha atual"
                    })
                }

            } else {
                return response.status(404).json({
                    message: "Conta não encontrada"
                })
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

    // ATUALIZA O EMAIL DA CONTA
    async updateEmail(request: Request, response: Response){
        const { novoEmail } = request.body
        const { id } = request.params
        
        const zodSchema = z.object({
            novoEmail: z.string({
                required_error: "Email é requerido",
                invalid_type_error: "Email precisa ser uma string"
            }).email(),
            id: z.string({
                required_error: "Id é requerido",
            })
        })

        try {
            
            zodSchema.parse({ novoEmail, id })

            const contaRepository = AppDataSource.getRepository(Conta)

            const conta = await contaRepository.findOne({
                where: {
                    idConta: +id
                }
            });

            if(conta){
                
                // Atualizar o email deveria ser tão trivial?

                conta.email = novoEmail

                await contaRepository.save(conta)

                return response.status(200).json({
                    message: "Email atualizado com sucesso"
                })

            }else{
                return response.status(404).json({
                    message: "Conta não encontrada"
                })
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

    // DELETA UMA CONTA PELO ID INFORMADO
    async delete(request: Request, response: Response) {
        const { id } = request.params

        const zodSchema = z.object({
            id: z.string({
                required_error: "Id é requerido"
            })
        })

        try {

            zodSchema.parse(request.params)
            
            const contaRepository = AppDataSource.getRepository(Conta)

            const conta = await contaRepository.findOne({
                where: {
                    idConta: +id
                }
            })

            if(conta){

                const deletedDate = new Date()

                conta.deletedAt = deletedDate
                await contaRepository.save(conta)

                return response.status(200).json({
                    message: "Conta deletada com sucesso"
                })

            }else{
                return response.status(404).json({
                    message: "Conta não encontrada"
                })
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

    // ENVIA UMA NOVA SENHA PARA O EMAIL INFORMADO CASO A CONTA EXISTA
    async recuperarSenha(request: Request, response: Response) {
        const { email } = request.body

        const zodSchema = z.object({
            email: z.string().email()
        });

        try {
            zodSchema.parse(request.body)

            const contaRepository = AppDataSource.getRepository(Conta)

            const conta = await contaRepository.findOne({
                where: {
                    email
                }
            });

            if (conta) {

                const novaSenha = generatePassword();
                const hashNovaSenha = await bcrypt.hash(novaSenha, 10);
                
                conta.senha = hashNovaSenha

                await contaRepository.save(conta)

                await sendEmail(email, novaSenha)

                return response.status(200).json({
                    message: "Uma nova senha foi enviada para seu email"
                });

            } else {
                return response.status(404).json({
                    message: "Não existe uma conta com este email"
                });
            }

        } catch (error: any) {
            let errors: string[] = [];

            if(error.issues != null){
                error.issues.forEach((issue: any) => {
                    errors.push(issue.message)
                });
    
                return response.status(400).json({
                    messages: errors
                })
            }

            return "Erro interno do servidor"
            
        }
    }
}