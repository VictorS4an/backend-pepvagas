import { AppDataSource } from "../database/data-source";
import { Request, Response } from "express";
import { Equipe } from "../database/models/Equipe";
import { Vaga } from "../database/models/Vaga";
import { IsNull, Not } from "typeorm"

export default {

    // FUNÇÃO PARA CRIAR UM NOVO MEMBRO DA EQUIPE
    async create(request: Request, response: Response) {
        try {
            const {
                nome,
                idconta,
            } = request.body;

            const equipeRepository = AppDataSource.getRepository(Equipe);
            const equipeExists = await equipeRepository.findOne({
                where: { idconta, deletedAt: IsNull()  },
            });
            if (equipeExists) {
                return response.status(409).json({ message: "Membro da Equipe já cadastrado" });
            }

            const equipe = equipeRepository.create({
                nome,
                idconta
            });

            await equipeRepository.save(equipe);

            return response.status(201).json(equipe);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // FUNÇÃO PARA LISTAR TODOS OS MEMBROS DA EQUIPE
    async index(request: Request, response: Response) {

        try {
            const equipeRepository = AppDataSource.getRepository(Equipe);
            const membros = await equipeRepository
                .createQueryBuilder('equipe')
                .withDeleted()
                .getMany();
            return response.status(200).json(membros);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // FUNÇÃO PARA DELETAR UM MEMBRO DA EQUIPE
    async delete(request: Request, response: Response) {
        try {
        const { id } = request.params;
    
        const membroRepository = AppDataSource.getRepository(Equipe); 
        const vagaRepository = AppDataSource.getRepository(Vaga);
    
        const membro = await membroRepository.findOneBy({ idconta: +id });
    
        if (!membro) {
            return response.status(404).json({ message: "Membro de equipe não encontrado" });
        }
    
        // Verifica se há vagas ativas vinculadas ao membro
        const vagasAtivas = await vagaRepository
            .createQueryBuilder("vaga")
            .where("vaga.idConta = :id", { id: membro.idconta })
            .andWhere("vaga.deletedAt IS NULL")
            .andWhere("vaga.data_limite >= CURRENT_DATE")
            .getCount();
    
        if (vagasAtivas > 0) {
            return response.status(400).json({ message: "Não é possível desativar o Membro da Equipe porque há vagas ativas." });
        }
    
        membro.deletedAt = new Date();
        await membroRepository.save(membro);
    
        return response.status(200).json({ message: "Membro de equipe desativado com sucesso." });
        } catch (error) {
        console.error("Erro ao desativar membro de equipe:", error);
        return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // FUNÇÃO PARA ENCONTRAR UM MEMBRO DA EQUIPE PELO ID
    async find(request: Request, response: Response) {
        const { id } = request.params;
        const equipeRepository = AppDataSource.getRepository(Equipe);
        try {
            const equipe = await equipeRepository.findOneBy({ idconta: +id });
            if (!equipe) {
                return response.status(404).json({ message: "Membro da Equipe não encontrado" });
            }
            return response.status(200).json(equipe);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // FUNÇÃO PARA ATUALIZAR OS DADOS DE UM MEMBRO DA EQUIPE
    async update(request: Request, response: Response) {
        const {
            nome
        } = request.body;

        const { id } = request.params;
        const equipeRepository = AppDataSource.getRepository(Equipe);
        try {
            const equipeExists = await equipeRepository.findOneBy({ idconta: + id });
            if (!equipeExists) {
                return response.status(404).json({ message: "Membro de Equipe não encontrado" });
            }
            else {
                console.log("Membro da equipe encontrado:", equipeExists);
            }

            equipeExists.nome = nome;


            await equipeRepository.save(equipeExists);
            return response.status(200).json(equipeExists);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // FUNÇÃO PARA PUBLICAR UMA VAGA ASSOCIADA A UM MEMBRO DA EQUIPE
    async publishVaga(request: Request, response: Response) {
        const { id } = request.params;
        const { idVaga } = request.body;
        const equipeRepository = AppDataSource.getRepository(Equipe);
        const vagaRepository = AppDataSource.getRepository(Vaga);
        try {
            const equipe = await equipeRepository.findOneBy({ idconta: + id });
            if (!equipe) {
                return response.status(404).json({ message: "Membro da Equipe não encontrado" });
            }
            const vaga = await vagaRepository.findOneBy({ idVaga: + idVaga });
            if (!vaga) {
                return response.status(404).json({ message: "Vaga não encontrada" });
            }
            vaga.conta = equipe.conta;
            await vagaRepository.save(vaga);
            return response.status(200).json(vaga);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    }
}
