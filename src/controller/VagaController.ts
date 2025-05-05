import { Request, Response } from "express"
import { date, z } from 'zod'
import { AppDataSource } from "../database/data-source"
import { Vaga } from "../database/models/Vaga"
import { Conta } from "../database/models/Conta"
import { Area } from "../database/models/Area"
import { Representante } from "../database/models/Representante";
import fs from 'fs'
import { MoreThan, MoreThanOrEqual } from "typeorm"
import { Empresa } from "../database/models/Empresa"
import FirebaseController from "./FirebaseController"
import { Candidato } from "../database/models/Candidato"
const nodemailer = require('nodemailer');

// CALCULA A DIFERENÇA EM DIAS ENTRE A DATA ATUAL E A DATA LIMITE
function calculateDiff(hoje: Date, limite: Date) {

    const diffInMs = hoje.getTime() > limite.getTime() ? (limite.getTime() - hoje.getTime()) : (limite.getTime() - hoje.getTime())
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays
}

export default {

    // RECEBE E ATUALIZA LOGO E BANNER DE UMA VAGA
    async sendLogoAndBanner(request: Request, response: Response) {
        const { idvaga } = request.params
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };

        const logo = files['logo'];
        const banner = files['banner'];

        const vagaRepository = AppDataSource.getRepository(Vaga)

        const vaga = await vagaRepository.findOneBy({
            idVaga: +idvaga
        })

        if (!vaga)
            return response.status(404).json({ message: "Não existe uma vaga com este ID" })

        if (!logo) {
            vaga.logo = 'vaga-logopadrao.svg';
            return response.status(400).json({ message: "Logo padrão adicionada." })
        }

        if (!banner) {
            vaga.logo = 'vaga-bannerpadrao.svg';
            return response.status(400).json({ message: "Banner padrão adicionado." })
        }



        if (vaga.logo != null && vaga.logo != "vaga-logopadrao.svg") {
            fs.unlink("./../../uploads/" + vaga.logo, (err) => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        }

        if (vaga.banner != null && vaga.banner != "vaga-bannerpadrao.svg") {
            fs.unlink("./../../uploads/" + vaga.banner, (err) => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        }

        vaga.logo = logo[0].filename;
        vaga.banner = banner[0].filename;
        vaga.deletedAt = null


        await vagaRepository.save(vaga)


        return response.status(200).json({ message: "Logo e banner da vaga adicionada com sucesso." })

    },

    // CRIA UMA NOVA VAGA NO SISTEMA
    async create(request: Request, response: Response) {
        const {
            idConta,
            titulo,
            modalidade,
            tipo,
            regime,
            descricao,
            salario,
            pcd,
            dataLimite,
            ocultarNome,
            cidade,
            nivelInstrucao,
            site,
            idArea,
            idEmpresa,
            emailCurriculo
        } = request.body

        const dadosObrigatorios = z.object({
            idArea: z.number({
                required_error: "Área é requerida"
            }),
            idEmpresa: z.number({
                required_error: "Empresa é requerida"
            }),
            idConta: z.number({
                required_error: "idConta é requerida"
            }),
            tipo: z.string({
                required_error: "Turno é requerido"
            }).max(20),
            descricao: z.string({
                required_error: "Descrição é requerida"
            }),
            titulo: z.string({
                required_error: "Titulo é requerida"
            }).max(70),
            modalidade: z.string({
                required_error: "Modalidade é requerida"
            }).max(1),
            regime: z.string({
                required_error: "Regime é requerido"
            }).max(20),
            salario: z.number({
                required_error: "Salário é requerido"
            }),
            pcd: z.boolean({
                required_error: "PCD é requerido"
            }),
            cidade: z.string({
                required_error: "Cidade é requerido"
            }).max(50),
            emailCurriculo: z.string({
                required_error: "Email para currículo é requerido"
            }).max(50).email(),
            ocultarNome: z.enum(['S', 'N']).default('N')
        })

        const dadosOpcionais = z.object({
            nivelInstrucao: z.string().max(40).nullable(),
            site: z.string().max(45).nullable()
        })

        try {
            dadosObrigatorios.parse({
                idArea,
                idEmpresa,
                idConta,
                tipo,
                descricao,
                titulo,
                modalidade,
                regime,
                salario,
                pcd,
                cidade,
                emailCurriculo
            })

            dadosOpcionais.parse({
                nivelInstrucao,
                site
            })

            const formatedDateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const hoje = new Date()
            const limite = new Date(dataLimite)

            let diff = calculateDiff(hoje, limite)


            const vagaRepository = AppDataSource.getRepository(Vaga)
            const contaRepository = AppDataSource.getRepository(Conta)
            const areaRepository = AppDataSource.getRepository(Area)
            const empresaRepository = AppDataSource.getRepository(Empresa)

            const area = await areaRepository.findOneBy({
                idArea
            })

            const empresa = await empresaRepository.findOneBy({
                idconta: idEmpresa
            })

            const conta = await contaRepository.findOneBy({
                idConta
            })

            if (!area) {
                return response.status(404).json({
                    message: "Essa área não existe"
                })
            } else if (!conta) {
                return response.status(404).json({
                    message: "Essa conta não existe"
                })
            } else if (!empresa) {
                return response.status(404).json({
                    message: "Essa empresa não existe"
                })
            } else if (diff < 0) {

                console.log("Data limite : " + limite)
                console.log("Formated Date: " + formatedDateNow)
                console.log("Data Limite com New Date: " + new Date(dataLimite))
                console.log("DIFF: " + diff)


                return response.status(400).json({
                    message: "Data limite tem que ser maior ou igual ao dia de hoje"
                })
            } else {
                console.log("Data limite : " + limite)
                console.log("Formated Date: " + formatedDateNow)
                console.log("Data Limite com New Date: " + new Date(dataLimite))
                console.log("DIFF: " + diff)
            }



            const vaga = vagaRepository.create({
                conta,
                titulo,
                modalidade,
                tipo,
                regime,
                descricao,
                salario,
                pcd,
                dataLimite,
                ocultarNome,
                cidade,
                nivelInstrucao,
                site,
                idArea,
                idEmpresa,
                emailCurriculo
            })

            const novaVaga = await vagaRepository.save(vaga)

            return response.status(201).json({
                idVaga: novaVaga.idVaga,
                message: "Vaga publicada com sucesso."
            })

            const candidatoRepository = AppDataSource.getRepository(Candidato);

            const candidatos = await candidatoRepository.findBy({
                cidade: cidade,
                nivelInstrucao: nivelInstrucao,
                tipoVaga: tipo,
                pcd: pcd,
                pretensaoSalarial: MoreThanOrEqual(salario)
            });

            candidatos.forEach(candidato => {
                if (candidato.tokenFirebase != null) {
                    FirebaseController.sendPushNotificationToToken(
                        candidato.tokenFirebase,
                        "Vaga anunciada com características do seu interesse!!",
                        "Título da vaga: " + titulo
                    );
                }
            });



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

    // RETORNA TODAS AS VAGAS ATIVAS
    async index(request: Request, response: Response) {
        const vagaRepository = AppDataSource.getRepository(Vaga)

        const date = new Date()
        const hoje = `${date.getFullYear()}-${(date.getMonth() < 12) ? date.getMonth() + 1 : 1}-${date.getDate()}`
        const formatDate = new Date(hoje)

        const vagas = await vagaRepository.find({
            where: {
                dataLimite: MoreThan(formatDate)
            },
            relations: {
                idArea: true,
                idEmpresa: true
            }
        })

        return response.status(200).json(vagas)
    },

    // REGISTRA UM CANDIDATO EM UMA VAGA
    async candidatar(request: Request, response: Response) {
        const { idconta, idVaga } = request.params;
    
        try {
            if (!idconta || !idVaga) {
                return response.status(400).json({ message: "ID do candidato ou ID da vaga está ausente." });
            }
    
            const candidatoRepository = AppDataSource.getRepository(Candidato);
            const vagaRepository = AppDataSource.getRepository(Vaga);
    
            const candidato = await candidatoRepository.findOne({
                where: { idconta: +idconta },
                relations: ["vagas"], 
            });
    
    
            const vaga = await vagaRepository.findOneBy({
                idVaga: +idVaga,
            });
    
            if (!candidato) {
                return response.status(404).json({ message: "Candidato não encontrado." });
            }
    
            if (!vaga) {
                return response.status(404).json({ message: "Vaga não encontrada." });
            }
    
            if (new Date(vaga.dataLimite) < new Date()) {
                return response.status(400).json({ message: "A vaga já expirou." });
            }
    
            const candidaturaExistente = candidato.vagas.some(v => v.idVaga === vaga.idVaga);
    
            if (candidaturaExistente) {
                return response.status(409).json({ message: "O candidato já se inscreveu nesta vaga." }); // ALTERADO PARA 409 (CONFLICT)
            }
    
            await AppDataSource
                .createQueryBuilder()
                .relation(Candidato, "vagas")
                .of(candidato)
                .add(vaga);
        
            return response.status(201).json({
                message: "Candidatura registrada com sucesso.",
                candidatura: vaga,
            });
    
        } catch (error) {
            return response.status(500).json({ message: "Erro ao registrar candidatura." });
        }
    },    

    // BUSCA UMA VAGA PELO ID FORNECIDO 
    async findById(request: Request, response: Response) {
        const {
            idVaga
        } = request.params

        const schema = z.object({
            idVaga: z.coerce.number()
        })

        try {

            schema.parse(request.params)

            const vagaRepository = AppDataSource.getRepository(Vaga)

            const vaga = await vagaRepository.findOne({
                where: {
                    idVaga: +idVaga
                },

                relations: {
                    conta: true,
                    idArea: true,
                    idEmpresa: true
                },
            })

            if (!vaga) {
                return response.status(404).json({
                    message: "Vaga não encontrada."
                })
            }

            return response.status(200).json(vaga)

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

    // BUSCA TODAS AS VAGAS ASSOCIADAS A UM DETERMINADO ID DE CONTA
    async findByIdConta(request: Request, response: Response) {
        const {
            id
        } = request.params

        const schema = z.object({
            id: z.coerce.number()
        })

        try {

            schema.parse(request.params)

            const vagaRepository = AppDataSource.getRepository(Vaga)

            const vagas = await vagaRepository.find({
                where: {
                    conta: {
                        idConta: +id
                    }
                },
                relations: {
                    conta: true,
                    idArea: true,
                    idEmpresa: true
                },
            })

            return response.status(200).json(vagas)
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

    // ATUALIZA UMA VAGA EXISTENTE COM NOVOS DADOS
    async update(request: Request, response: Response) {
        const {
            idVaga
        } = request.params

        const {
            titulo,
            modalidade,
            tipo,
            regime,
            descricao,
            salario,
            pcd,
            dataLimite,
            ocultarNome,
            cidade,
            nivelInstrucao,
            logo,
            banner,
            site,
            idArea,
            idEmpresa,
            emailCurriculo
        } = request.body


        const idSchema = z.object({
            idVaga: z.coerce.number()
        })

        const dadosObrigatorios = z.object({
            idArea: z.number(),
            idEmpresa: z.number(),
            tipo: z.string().max(20),
            descricao: z.string(),
            titulo: z.string().max(70),
            modalidade: z.string().max(1),
            regime: z.string().max(20),
            salario: z.number(),
            pcd: z.boolean(),
            dataLimite: z.coerce.date(),
            ocultarNome: z.enum(['S', 'N']),
            cidade: z.string().max(50),
            emailCurriculo: z.string().max(50).email()
        })

        const dadosOpcionais = z.object({
            nivelInstrucao: z.string().max(40).nullable(),
            site: z.string().max(45).nullable()
        })

        try {

            idSchema.parse(request.params)

            dadosObrigatorios.parse({
                idArea,
                idEmpresa,
                tipo,
                descricao,
                titulo,
                modalidade,
                regime,
                salario,
                pcd,
                dataLimite,
                cidade,
                emailCurriculo,
                ocultarNome
            })

            dadosOpcionais.parse({
                nivelInstrucao,
                site
            })

            const formatedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const vagaRepository = AppDataSource.getRepository(Vaga)
            const areaRepository = AppDataSource.getRepository(Area)
            const empresaRepository = AppDataSource.getRepository(Empresa)

            const vaga = await vagaRepository.findOneBy({
                idVaga: +idVaga
            })

            const area = await areaRepository.findOneBy({
                idArea
            })

            const empresa = await empresaRepository.findOneBy({
                idconta: idEmpresa
            })

            if (!vaga) {
                return response.status(404).json({
                    message: "Esta vaga não existe"
                })
            } else if (!area) {
                return response.status(404).json({
                    message: "Essa área não existe"
                })
            } else if (!empresa) {
                return response.status(404).json({
                    message: "Essa empresa não existe"
                })
            } else if (dataLimite < formatedDate) {

                return response.status(400).json({
                    message: "Data limite tem que ser maior ou igual ao dia de hoje"
                })
            }

            vaga.cidade = cidade,
            vaga.dataLimite = dataLimite
            vaga.idArea = area
            vaga.idEmpresa = empresa
            vaga.descricao = descricao
            vaga.logo = logo
            vaga.banner = banner
            vaga.modalidade = modalidade
            vaga.emailCurriculo = emailCurriculo
            vaga.nivelInstrucao = nivelInstrucao
            vaga.pcd = pcd
            vaga.tipo = tipo
            vaga.titulo = titulo
            vaga.regime = regime
            vaga.salario = salario
            vaga.site = site
            vaga.ocultarNome = ocultarNome;

            await vagaRepository.save(vaga)

            return response.status(200).json({
                message: "Vaga atualizada com sucesso"
            })

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

    // MARCA UMA VAGA COMO EXCLUÍDA (EXCLUSÃO LÓGICA)
    async delete(request: Request, response: Response) {
        const { idVaga } = request.params

        const schema = z.object({
            idVaga: z.coerce.number()
        })

        try {

            schema.parse(request.params)

            const vagaRepository = AppDataSource.getRepository(Vaga)

            const vaga = await vagaRepository.findOne({
                where: {
                    idVaga: +idVaga
                }
            })

            if (!vaga) {
                return response.status(404).json({
                    message: "Vaga não encontrada."
                })
            }

            const dataExclusao = new Date()

            vaga.deletedAt = dataExclusao;

            await vagaRepository.save(vaga)

            return response.status(200).json({
                message: "Vaga excluída com sucesso."
            })

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
// GET /vaga/representante/:idRepresentante
async vagasDoRepresentante(request: Request, response: Response) {
    const { idRepresentante } = request.params;

    // 💡 Verificação inicial com return
    if (!idRepresentante || isNaN(Number(idRepresentante))) {
        return response.status(400).json({
            message: "ID do representante inválido."
        });
    }

    const schema = z.object({
        idRepresentante: z.coerce.number()
    });

    try {
        const { idRepresentante: idParsed } = schema.parse(request.params);

        const representanteRepo = AppDataSource.getRepository(Representante);
        const vagaRepo = AppDataSource.getRepository(Vaga);

        const representante = await representanteRepo.findOne({
            where: { idconta: idParsed },
            relations: ["idEmpresa"]
        });

        if (!representante || !representante.idEmpresa) {
            return response.status(404).json({ message: "Representante ou empresa não encontrada." });
        }

        const vagas = await vagaRepo.find({
            where: [
                { conta: { idConta: idParsed } },
                { idEmpresa: { idconta: representante.idEmpresa.idconta } }
            ],
            relations: {
                conta: true,
                idArea: true,
                idEmpresa: true
            }
        });

        return response.status(200).json(vagas);
    } catch (error: any) {
        console.error(error);

        if (error.issues) {
            const messages = error.issues.map((issue: any) => issue.message);
            return response.status(400).json({ messages });
        }

        return response.status(500).json({ message: "Erro ao buscar vagas do representante." });
    }
}

    // async vagasMatch(request: Request, response: Response){
    //     const { idCandidato } = request.params

    //     const candidatoRepository = AppDataSource.getRepository(Candidato)
    //     const vagaRepository = AppDataSource.getRepository(Vaga)

    //     const candidato = await candidatoRepository.findOneBy({
    //         idconta: +idCandidato
    //     })

    //     if(!candidato){
    //         return response.status(404).json({
    //             message: "Candidato não encontrado."
    //         })
    //     }

    //     if(candidato.tipoVaga == null || candidato.pretensaoSalarial == null || candidato.pretensaoSalarial == null || candidato.cidade == null){
    //         const vagas = await vagaRepository.find()

    //         return response.status(200).json(vagas)
    //     }else{
    //         const vagas = await vagaRepository.find({
    //             where: [
    //                 { pcd: candidato.pcd },
    //                 { salario: MoreThanOrEqual(candidato.pretensaoSalarial) },
    //                 { cidade: candidato.cidade }
    //             ]
    //         })

    //         return response.status(200).json(vagas)
    //     }
    // },
}