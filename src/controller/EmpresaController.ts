import { Request, Response } from "express";
import { Empresa } from "../database/models/Empresa";
import { AppDataSource } from "../database/data-source";
import { Representante } from "../database/models/Representante";
import { Vaga } from "../database/models/Vaga";
import { Not, IsNull } from "typeorm";

export default {

    // CRIA UMA NOVA EMPRESA
    async create(request: Request, response: Response) {
        const {
            idconta,
            nomeEmpresa,
            cnpj,
            site,
            telefone,
            email,
        } = request.body;

        const empresaRepository = AppDataSource.getRepository(Empresa);

        const empresaWithEmail = await empresaRepository.findOne({ where: {
            idconta,
            deletedAt: IsNull()  
        }});
        const empresaWithCNPJ = await empresaRepository.findOne({ where: {
            cnpj,
            deletedAt: IsNull()  // só considera empresa ativa
        }});

        if (empresaWithEmail) {
            return response.status(409).json({ message: "Empresa com a mesma conta já cadastrada." });
        }
        
        if (empresaWithCNPJ) {
            return response.status(409).json({ message: "Empresa com o mesmo CNPJ já cadastrada" });
        }        

        try {
            const empresa = empresaRepository.create({
                idconta,
                nomeEmpresa,
                cnpj,
                site,
                telefone,
                email,
            });
            await empresaRepository.save(empresa);

            return response.status(201).json(empresa);
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    //FUNÇÃO QUE VERIFICA A EXISTÊNCIA DE UM CNPJ JÁ CADASTRADO NO BANCO
    async verificarCNPJRepetido(request: Request, response: Response) {
        let { cnpj } = request.params;

        cnpj = cnpj.replace(/\D/g, '');

        const empresaRepository = AppDataSource.getRepository(Empresa);

        try {
            const empresa = await empresaRepository.findOne({ where: {
                cnpj,
                deletedAt: IsNull()
            } });

            if (empresa) {
                return response.status(200).json({ message: "Já existe uma empresa com este CNPJ" });
            } else {
                return response.status(404).json({ message: "Nenhuma empresa encontrada com este CNPJ" });
            }
        } catch (error) {
            console.error("Erro ao verificar CNPJ repetido:", error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // LISTA TODAS AS EMPRESAS
    async index(request: Request, response: Response) {
        const empresaRepository = AppDataSource.getRepository(Empresa);

        try {
            const empresas = await empresaRepository
                .createQueryBuilder('empresa')
                .withDeleted()
                .getMany();

            return response.status(200).json(empresas);
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // ATUALIZA OS DADOS DE UMA EMPRESA EXISTENTE
    async update(request: Request, response: Response) {
        try {

            const {
                nomeEmpresa,
                cnpj,
                site,
                telefone,
                email,
            } = request.body;
            const { id } = request.params;
            const empresaRepository = AppDataSource.getRepository(Empresa);

            const empresaExists = await empresaRepository.findOneBy({ idconta: +id });
            if (!empresaExists) {
                return response.status(404).json({ message: "Empresa não cadastrada" });
            }
            const empresaWithEmail = await empresaRepository.findOne({ where: { email } });
            const empresaWithCNPJ = await empresaRepository.findOne({ where: { cnpj } });

            if (empresaWithEmail && empresaWithEmail.deletedAt == null && empresaWithEmail.idconta !== empresaExists.idconta) {
                return response.status(409).json({ message: "Empresa com o mesmo email de contato já cadastrada" });
            }

            if (empresaWithCNPJ && empresaWithCNPJ.deletedAt == null && empresaWithCNPJ.idconta !== empresaExists.idconta) {
                return response.status(409).json({ message: "Empresa com o mesmo CNPJ já cadastrada" });
            }

            empresaExists.nomeEmpresa = nomeEmpresa;
            empresaExists.cnpj = cnpj;
            empresaExists.email = email;
            empresaExists.site = site;
            empresaExists.telefone = telefone

            const empresa = empresaRepository.create(empresaExists);
            await empresaRepository.save(empresa);
            return response.status(200).json(empresa);
        } catch (error) {
            console.error("Error durante a alteração dos dados:", error);
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // MARCA UMA EMPRESA COMO DELETADA
    async delete(request: Request, response: Response) {
        const { id } = request.params;
        const empresaRepository = AppDataSource.getRepository(Empresa);
        const representanteRepository = AppDataSource.getRepository(Representante);
        const vagaRepository = AppDataSource.getRepository(Vaga);
        const empresa = await empresaRepository.findOne({ where: { idconta: +id } });

        if (!empresa) {
            return response.status(404).json({ data: { message: "Empresa não encontrada" } });
        }

        try {
            const representantes = await representanteRepository
                .createQueryBuilder("representante")
                .where("representante.empresa = :idconta", { idconta: empresa.idconta })
                .andWhere("representante.deletedAt IS NULL")
                .getMany();

            if (representantes.length > 0) {
                return response.status(400).json({ data: { message: "Não é possível desativar a empresa porque há representantes ativos." } });
            }

            const vagasAtivas = await vagaRepository
                .createQueryBuilder("vaga")
                .where("vaga.idConta = :idconta", { idconta: empresa.idconta })
                .andWhere("vaga.deletedAt IS NULL")
                .andWhere("vaga.data_limite >= CURRENT_DATE")
                .getCount();

            if (vagasAtivas > 0) {
                return response.status(400).json({ data: { message: "Não é possível desativar a empresa porque há vagas ativas." } });
            }
            empresa.deletedAt = new Date();
            await empresaRepository.save(empresa);

            return response.status(200).json({ data: { message: "Empresa desativada com sucesso." } });
        } catch (error) {
            console.error("Erro ao desativar a empresa:", error);
            return response.status(500).json({ data: { message: "Erro interno do servidor" } });
        }
    },

    // FUNÇÃO PARA ENCONTRAR UMA EMPRESA PELO ID
    async findById(request: Request, response: Response) {
        const { id } = request.params;
        const empresaRepository = AppDataSource.getRepository(Empresa);

        try {
            const empresa = await empresaRepository.findOne({ where: { idconta: +id }, withDeleted: true });

            if (!empresa) {
                return response.status(404).json({ message: "Empresa não encontrada" });
            }

            return response.status(200).json(empresa);
        } catch (error) {
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // FUNÇÃO PARA ENCONTRAR O REPRESENTANTE DE UMA EMPRESA PELO ID
    async getRepresentantesByEmpresaId(request: Request, response: Response) {
        const { id } = request.params;
        const representanteRepository = AppDataSource.getRepository(Representante);

        try {

            const representantes = await representanteRepository.find({
                where: {
                    idEmpresa: {
                        idconta: +id
                    },
                    conta: Not(IsNull()),
                },
                relations: ["idEmpresa", "conta"]
            });


            if (representantes.length === 0) {
                return response.status(404).json({ message: "Nenhum representante encontrado para esta empresa" });
            }

            return response.status(200).json(representantes);
        } catch (error) {
            console.error("Erro ao buscar representantes:", error);
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    }

}
