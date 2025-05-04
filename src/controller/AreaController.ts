import { Request, Response } from "express"; 
import { AppDataSource } from "../database/data-source";
import { Area } from "../database/models/Area";
import { z } from "zod"

export default {
    /**
     * Cria uma nova área.
     * Verifica se a área já existe antes de criar.
     * Se a área já existir, retorna erro de conflito.
     */
    async create(request: Request, response: Response) {
        const { nome } = request.body;

        // Definição do schema de validação
        const areaSchema = z.object({
            nome: z.string({
                required_error: "o nome da area é requerido",
                invalid_type_error: "o nome da area deve ser uma string"
            })
        });

        try {
            // Valida os dados do corpo da requisição
            areaSchema.parse(request.body)
            const areaRepository = AppDataSource.getRepository(Area);
            
            // Verifica se já existe uma área com o mesmo nome
            const areaExists = await areaRepository.findOne({ where: { nome }});

            if (areaExists) {
                // Se a área já existir, retorna erro
                return response.status(422).json({ message: "Área já cadastrada" });
            }
            
            // Cria a nova área
            const newArea = areaRepository.create({ nome });

            // Salva a nova área no banco de dados
            const newAreaId = await areaRepository.save(newArea);

            return response.status(201).json({message: "Área criada com sucesso", id: newAreaId.idArea });

        } catch (error: any){
            // Caso ocorra um erro de validação, retorna os erros encontrados
            let errors: string[] = [];
            error.issues.forEach((issue: any) => {
                errors.push(issue.message)
            });

            return response.status(400).json({
                messages: errors
            })
        }
        
    },

    /**
     * Retorna a lista de todas as áreas cadastradas.
     */
    async index(request: Request, response: Response) {
        try {
            // Obtém o repositório de áreas
            const areaRepository = AppDataSource.getRepository(Area);

            // Busca todas as áreas no banco de dados
            const areas = await areaRepository.find()

            // Retorna as áreas encontradas
            return response.status(200).json(areas);

        } catch (error: any) {
            // Caso ocorra um erro, retorna os erros encontrados
            let errors: string[] = [];
            error.issues.forEach((issue: any) => {
                errors.push(issue.message)
            });

            return response.status(400).json({
                messages: errors
            })
        }
    },

    /**
     * Deleta uma área (marcando-a como deletada).
     * Verifica se há vagas ou candidatos associados antes de permitir a remoção.
     */
    async delete(request: Request, response: Response) {
        const { id } = request.params;

        // Definição do schema para validação do id na requisição
        const deleteSchema = z.object({
            id: z.string({
                required_error: "Id é requerido"
            })
        })
        
        try {
            const deletedDate = new Date()

            // Valida o id na requisição
            deleteSchema.parse(request.params)

            // Obtém o repositório de áreas
            const areaRepository = AppDataSource.getRepository(Area);

            // Verifica se a área existe
            const area = await areaRepository.findOneBy({ idArea: +id });
            if (!area) {
                // Se não encontrar a área, retorna erro
                return response.status(404).json({ message: "Área não encontrada" });
            }

            // Verifica se há vagas associadas à área
            if (area.vagas != null) {
                return response.status(422).json({ message: "Não é possível deletar a área. Ainda há vagas associadas a ela" });
            }

            // Verifica se há candidatos associados à área
            if(area.candidatos != null){
                return response.status(422).json({message: "Não é possível deletar a área. Ainda há candidatos associados a ela"})
            }
    
            // Marca a área como deletada 
            area.deletedAt = deletedDate;
            await areaRepository.save(area);

            return response.status(200).json({ message: "Área deletada com sucesso" });            

        } catch (error: any) {
            console.log(error)
            let errors: string[] = [];
            error.issues.forEach((issue: any) => {
                errors.push(issue.message)
             });

            // Retorna os erros encontrados durante a execução
            return response.status(400).json({
                messages: errors
            })
        }
    },

    /**
     * Atualiza os dados de uma área.
     * Verifica se a área existe e se o novo nome é único antes de salvar.
     */
    async update(request: Request, response: Response) {
        const { id } = request.params
        const { nome } = request.body;

        // Definição dos schemas para validação do id e nome
        const updateId= z.object({
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
            // Valida os parâmetros da requisição
            updateId.parse(request.params)
            updateNome.parse(request.body)

            // Obtém o repositório de áreas
            const areaRepository = AppDataSource.getRepository(Area);

            // Verifica se a área existe
            const area = await areaRepository.findOneBy({ idArea: +id });

            if (!area) {
                // Se a área não for encontrada, retorna erro
                return response.status(404).json({ message: "Área não encontrada" });
            }

            // Verifica se já existe outra área com o mesmo nome
            const areaWithSameName = await areaRepository.findOne({ where: { nome } });

            if (areaWithSameName && areaWithSameName.idArea !== area.idArea) {
                // Se houver outra área com o mesmo nome, retorna erro
                return response.status(422).json({ message: "Nome de área já existe" });
            }

            // Atualiza o nome da área
            area.nome = nome;

            // Salva as alterações no banco de dados
            await areaRepository.save(area);

            // Retorna a área atualizada
            return response.status(200).json(area);

        } catch (error: any) {
            // Em caso de erro de validação, retorna os erros encontrados
            let errors: string[] = [];
            error.issues.forEach((issue: any) => {
                errors.push(issue.message)
            });

            return response.status(400).json({
                messages: errors
            })
        }
    },
    
    /**
     * Busca uma área pelo id.
     * Retorna a área correspondente ou um erro caso não exista.
     */
    async findById(request: Request, response: Response) {
        const { id } = request.params;
        
        // Definição do schema para validação do id
        const findSchema = z.object({
            id: z.string({
                required_error: "Id é requerido"
            })
        })

        try {
            // Valida o id da requisição
            findSchema.parse(request.params)
            
            // Obtém o repositório de áreas
            const areaRepository = AppDataSource.getRepository(Area);

            // Busca a área pelo id
            const area = await areaRepository.findOneBy({ idArea: +id });

            if (!area) {
                // Se não encontrar a área, retorna erro
                return response.status(404).json({ message: "Área não encontrada" });
            }

            // Retorna a área encontrada
            return response.status(200).json(area);

        } catch (error: any) {
            // Caso ocorra um erro de validação, retorna os erros encontrados
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
