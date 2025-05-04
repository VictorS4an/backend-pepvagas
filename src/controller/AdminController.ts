import { Request, Response } from "express"; 
import { AppDataSource } from "../database/data-source";
import { Administrador } from "../database/models/Administrador";
import { Vaga } from "../database/models/Vaga";
import { Conta } from "../database/models/Conta";
import {IsNull } from "typeorm";

export default {
    /**
     * Cria um novo administrador.
     * Verifica se já existe um administrador com o mesmo idconta antes de criar.
     * Caso já exista, retorna erro de conflito.
     */
    async create(request: Request, response: Response) {
        try {
            // corpo da requisição
            const { idconta, nome } = request.body;

            // Obtém o repositório de administradores
            const adminRepository = AppDataSource.getRepository(Administrador);

            // Verifica se o administrador já existe com o idconta fornecido
            const adminExists = await adminRepository.findOne({
                where: { idconta: idconta, deletedAt: IsNull() },
            });

            // Se o administrador já existir e não tiver sido removido, retorna erro
            if (adminExists) {
                return response.status(409).json({ message: "Administrador já cadastrado" });
            }

            // Cria o novo administrador
            const admin = adminRepository.create({
                idconta,
                nome
            });

            // Salva o novo administrador no banco de dados
            await adminRepository.save(admin);

            return response.status(201).json(admin);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    /**
     * Retorna a lista de todos os administradores cadastrados.
     */
    async index(request: Request, response: Response) {
        const adminRepository = AppDataSource.getRepository(Administrador);

        try {
            // Busca todos os administradores no banco de dados
            const administradores = await adminRepository.find();

            // Retorna a lista de administradores
            return response.status(200).json(administradores);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    /**
     * Remove um administrador e sua conta associada.
     * Antes, verifica se há vagas associadas ao administrador.
     */
    async delete(request: Request, response: Response) {
        const { id } = request.params;
        const adminRepository = AppDataSource.getRepository(Administrador);
        const vagaRepository = AppDataSource.getRepository(Vaga);
        const contaRepository = AppDataSource.getRepository(Conta);

        try {
            // Busca o administrador pelo idconta
            const admin = await adminRepository.findOneBy({ idconta: +id });

            // Se o administrador não for encontrado, retorna erro
            if (!admin) {
                return response.status(404).json({ message: "Usuário não encontrado" });
            }

            // Verifica se o administrador tem vagas associadas
            const vaga = await vagaRepository.findOneBy({ idVaga: +id });

            if (vaga) {
                return response.status(422).json({ message: "Não é possível remover o usuário. Ainda há vagas associadas a ele" });
            }

            // Marca o administrador como removido 
            admin.deletedAt = new Date();
            await adminRepository.save(admin);

            // Marca a conta associada como removida
            const conta = await contaRepository.findOne({
                where: { idConta: admin.idconta }
            });

            if (conta) {
                conta.deletedAt = new Date();
                await contaRepository.save(conta);
            }

            return response.status(200).json({ message: "Administrador e conta removidos com sucesso" });
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    /**
     * Busca um administrador pelo id.
     */
    async find(request: Request, response: Response) {
        const { id } = request.params;

        try {
            // Obtém o repositório de administradores
            const adminRepository = AppDataSource.getRepository(Administrador);

            // Busca o administrador pelo idconta
            const admin = await adminRepository.findOneBy({ idconta: +id });

            if (!admin) {
                return response.status(404).json({ message: "Administrador não encontrado" });
            }

            // Retorna os dados do administrador
            return response.status(200).json(admin);

        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    /**
     * Atualiza os dados de um administrador.
     * Caso o administrador não exista, retorna erro.
     */
    async update(request: Request, response: Response) {
        const { idconta, nome } = request.body;
        const { id } = request.params;

        const adminRepository = AppDataSource.getRepository(Administrador);

        try {
            // Verifica se o administrador existe
            const adminExists = await adminRepository.findOneBy({ idconta: +id });

            // Se o administrador não existir, retorna erro
            if (!adminExists) {
                return response.status(404).json({ message: "Administrador não cadastrado" });
            }

            adminExists.nome = nome;

            // Salva as alterações no banco de dados
            await adminRepository.save(adminExists);

            // Retorna os dados atualizados do administrador
            return response.status(200).json(adminExists);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    }
};
