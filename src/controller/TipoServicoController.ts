import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { TipoServico } from "../database/models/TipoServico";
import { z } from "zod"

export default {

    // CRIA UM NOVO TIPO DE SERVIÇO
    async create(request: Request, response: Response) {
        const { nome } = request.body;

        const tipoSrvicoSchema = z.object({
            nome: z.string({
                required_error: "o nome do tipo de serviço é requerido",
                invalid_type_error: "o nome do tipo de serviço deve ser uma string"
            })
        });

        try {
            tipoSrvicoSchema.parse(request.body)

            const tipoServicoRepository = AppDataSource.getRepository(TipoServico);
            const tipoExists = await tipoServicoRepository.findOne({ where: { nome } });

            if (tipoExists) {
                return response.status(409).json({ message: "Tipo de Servico já cadastrado" });
            }

            const tipoServico = tipoServicoRepository.create({ nome });

            await tipoServicoRepository.save(tipoServico);
            return response.status(201).json(tipoServico);


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

    // RETORNA TODOS OS TIPOS DE SERVIÇO
    async index(request: Request, response: Response) {
        try {
            const tipoServicoRepository = AppDataSource.getRepository(TipoServico);
            const tipoServico = await tipoServicoRepository.find();
            return response.status(200).json(tipoServico);

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

    // DELETA LOGICAMENTE UM TIPO DE SERVIÇO
    async delete(request: Request, response: Response) {
        const { id } = request.params;

        const tipoSrvicoSchema = z.object({
            id: z.string({
                required_error: "o id do tipo de serviço é requerido",
            })
        });

        try {
            tipoSrvicoSchema.parse(request.params)

            const tipoServicoRepository = AppDataSource.getRepository(TipoServico);
            const tipoServico = await tipoServicoRepository.findOneBy({ idTipoServico: +id });

            if (!tipoServico) {
                return response.status(404).json({ message: "Tipo de serviço não encontrado" });
            }

            if (tipoServico.profissionaisLiberais != null) {
                return response.status(422).json({ message: "Não é possicel deletar o tipo de serviço. Ainda tem proficional liberal associados a ele" })

            }

            tipoServico.deletedAt = new Date();
            await tipoServicoRepository.save(tipoServico);
            return response.status(200).json({ message: "TIpo de serviço deletado com sucesso" });

        } catch (error: any) {
            console.log(error)
            let errors: string[] = [];
            error.issues.forEach((issue: any) => {
                errors.push(issue.message)
            });

            return response.status(400).json({
                messages: errors
            })
        }

    },

     // BUSCA UM TIPO DE SERVIÇO PELO ID
    async findById(request: Request, response: Response) {
        const { id } = request.params;

        const tipoSrvicoSchema = z.object({
            id: z.string({
                required_error: "o id do tipo de serviço é requerido",
            })
        });

        try {
            tipoSrvicoSchema.parse(request.params)
            const tipoServicoRepository = AppDataSource.getRepository(TipoServico);
            const tipoServico = await tipoServicoRepository.findOneBy({ idTipoServico: +id });
            if (!tipoServico) {
                return response.status(404).json({ message: "Tipo Servico não encontrado" });
            }
            return response.status(200).json(tipoServico);
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

    // BUSCA PROFISSIONAIS ASSOCIADOS A UM TIPO DE SERVIÇO
    async findProfissionais(request: Request, response: Response) {
        const { id } = request.params;

        const tipoServicoSchema = z.object({
            id: z.string({
                required_error: "o id do tipo de serviço é requerido",
            })
        });

        try {
            tipoServicoSchema.parse(request.params)
            const tipoServicoRepository = AppDataSource.getRepository(TipoServico);
            const tipoServico = await tipoServicoRepository.findOne({
                where: {
                    idTipoServico: +id
                },
                relations: {
                    profissionaisLiberais: true
                }
            });
            if (!tipoServico) {
                return response.status(404).json({ message: "Tipo Servico não encontrado" });
            }
            const profissionais = tipoServico.profissionaisLiberais;

            return response.status(200).json(profissionais);
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

    // ATUALIZA UM TIPO DE SERVIÇO EXISTENTE
    async update(request: Request, response: Response) {
        const { nome } = request.body;
        const { id } = request.params;

        const updateId = z.object({
            id: z.string({
                required_error: "Id é requerido"
            }),
        })

        const updateNome = z.object({
            nome: z.string({
                required_error: "O nome é Requerido"
            })
        })
        try {
            updateId.parse(request.params)
            updateNome.parse(request.body)

            const tipoServicoRepository = AppDataSource.getRepository(TipoServico);
            const tipoServico = await tipoServicoRepository.findOneBy({ idTipoServico: +id });

            if (!tipoServico) {
                return response.status(404).json({ message: "Tipo Servico não encontrado" });
            }

            const tipoServicoMesmoNome = await tipoServicoRepository.findOne({ where: { nome } });

            if (tipoServicoMesmoNome && tipoServicoMesmoNome.idTipoServico != tipoServico.idTipoServico) {
                return response.status(422).json({ message: "Já existe um tipo Servico com esse nome" });
            }

            tipoServico.nome = nome;
            await tipoServicoRepository.save(tipoServico);
            return response.status(200).json(tipoServico);

        } catch (error: any) {
            let errors: string[] = [];
            error.issues.forEach((issue: any) => {
                errors.push(issue.message)
            });

            return response.status(400).json({
                messages: errors
            })
        }
    }
}


