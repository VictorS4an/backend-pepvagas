import { Request, Response } from "express";
import { Representante } from "../database/models/Representante";
import { AppDataSource } from "../database/data-source";
import { Vaga } from "../database/models/Vaga";
import { In, IsNull } from "typeorm";

export default{
    
    // CRIA UM NOVO REPRESENTANTE
    async create(request: Request, response: Response) {
        try {
            const {
                idconta,
                nome,
                idEmpresa,
            } = request.body;

            const representanteRepository = AppDataSource.getRepository(Representante);
            const representanteExists = await representanteRepository.findOne({
                where: { idconta, deletedAt: IsNull() },
            });
            if (representanteExists) {
                return response.status(409).json({ message: "Representante já cadastrado" });
            }

            const representante = representanteRepository.create({
                idconta,
                nome,
                idEmpresa,
            });
            await representanteRepository.save(representante);
            console.log("Representante succesfully created!");
            return response.status(201).json(representante);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // RETORNA TODOS OS REPRESENTANTES, INCLUINDO OS DELETADOS
    async index(request: Request, response: Response) {
        const representanteRepository = AppDataSource.getRepository(Representante);
    
        try {
            const representantes = await representanteRepository
                .createQueryBuilder('representante')
                .withDeleted()
                .getMany();
    
            return response.status(200).json(representantes);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // ATUALIZA OS DADOS DE UM REPRESENTANTE EXISTENTE
    async update(request: Request, response: Response) {
        const {
            idconta,
            nome,
            idEmpresa,
        } = request.body;
        const { id } = request.params;
        const representanteRepository = AppDataSource.getRepository(Representante);
        try {
            const representanteExists = await representanteRepository.findOneBy({ idconta: +id });
            if (!representanteExists) {
                return response.status(404).json({ message: "Representante não cadastrado" });
            }
            representanteExists.nome = nome;
            representanteExists.idEmpresa = idEmpresa;

            await representanteRepository.save(representanteExists);
            console.log("Succesfully Saved!");
            return response.status(200).json(representanteExists);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // DELETA LOGICAMENTE UM REPRESENTANTE
    async delete(request: Request, response: Response) {
        try {
          const { id } = request.params;
          const representanteRepository = AppDataSource.getRepository(Representante);
          const vagaRepository = AppDataSource.getRepository(Vaga);
      
          const representante = await representanteRepository.findOneBy({ idconta: +id });
      
          if (!representante) {
            return response.status(404).json({ message: "Representante não encontrado" });
          }
      
          // Verifica se há vagas ativas vinculadas ao representante
          const vagasAtivas = await vagaRepository
            .createQueryBuilder("vaga")
            .where("vaga.idConta = :id", { id: representante.idconta })
            .andWhere("vaga.deletedAt IS NULL")
            .andWhere("vaga.data_limite >= CURRENT_DATE")
            .getCount();
      
          if (vagasAtivas > 0) {
            return response.status(400).json({ message: "Não é possível deletar o representante. Existem vagas ativas vinculadas a ele." });
          }
      
          representante.deletedAt = new Date();
          await representanteRepository.save(representante);
      
          return response.status(200).json({ message: "Representante desativado com sucesso." });
        } catch (error) {
          console.error("Erro ao desativar representante:", error);
          return response.status(500).json({ message: "Erro interno do servidor" });
        }
      },      
    
    // BUSCA UM REPRESENTANTE PELO ID
    async findById(request: Request, response: Response) {
        const { id } = request.params;
        const representanteRepository = AppDataSource.getRepository(Representante);
        
        try {
            const representante = await representanteRepository.findOne({
                where: { idconta: +id },
                relations: ["idEmpresa"], // Adiciona as relações 'conta' e 'idEmpresa'
                withDeleted: true
            });
    
            if (!representante) {
                return response.status(404).json({ message: "Representante não encontrado" });
            }
    
            return response.status(200).json(representante);
        } catch (error) {
            console.error(error);
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },
    
    async getEmpresaByRepresentante(request: Request, response: Response) {
        const { id } = request.params; 
        const representanteRepository = AppDataSource.getRepository(Representante);
    
        try {
            const representante = await representanteRepository.findOne({
                where: { idconta: +id }, 
                relations: ["idEmpresa"], 
            });
    
            if (!representante || !representante.idEmpresa) {
                return response.status(404).json({ message: "Empresa do representante não encontrada" });
            }
    
            return response.status(200).json({ idEmpresa: representante.idEmpresa.idconta });
        } catch (error) {
            return response.status(500).json({ message: "Erro ao buscar empresa do representante", error });
        }
    },    
    
}
