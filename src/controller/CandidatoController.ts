import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { hash } from "bcrypt";
import * as bcrypt from "bcrypt";
import { In, IsNull } from "typeorm";
import { TipoUsuario } from "../../../shared/enums/TipoUsuario";
import { Candidato } from "../database/models/Candidato";
import { Conta } from "../database/models/Conta";
import { Vaga } from "../database/models/Vaga";
import { Column, Like, Not, OneToMany } from "typeorm";
import { Area } from "../database/models/Area";
import FirebaseController from "./FirebaseController";
import { sendEmailCurriculo, sendEmailCurriculoDoPerfil } from "./EmailController";
import { string, z } from 'zod'
import fs from 'fs'
import path from 'path';

// FUNÇÃO PARA VALIDAR UM CPF REALIZA O CÁLCULO DE VALIDAÇÃO UTILIZANDO OS DÍGITOS VERIFICADORES
function isValidCPF(cpf: string) {
    if (typeof cpf !== "string") return false;
    cpf = cpf.replace(/[\s.-]*/gim, "");
    if (
        !cpf ||
        cpf.length != 11 ||
        cpf == "00000000000" ||
        cpf == "11111111111" ||
        cpf == "22222222222" ||
        cpf == "33333333333" ||
        cpf == "44444444444" ||
        cpf == "55555555555" ||
        cpf == "66666666666" ||
        cpf == "77777777777" ||
        cpf == "88888888888" ||
        cpf == "99999999999"
    ) {
        return false;
    }
    var soma = 0;
    var resto;
    for (var i = 1; i <= 9; i++)
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;
    if (resto != parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (var i = 1; i <= 10; i++)
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;
    if (resto != parseInt(cpf.substring(10, 11))) return false;
    return true;
}

export default {

    // FUNÇÃO PARA ENVIAR O CURRÍCULO DE UM CANDIDATO. 
    async sendCV(request: Request, response: Response) {

        const { idconta } = request.params
        const pdf = request.file

        const candidatoRepository = AppDataSource.getRepository(Candidato)

        const candidato = await candidatoRepository.findOneBy({
            idconta: +idconta
        })

        if (!candidato)
            return response.status(404).json({ message: "Candidato não encontrado" })

        if (!pdf)
            return response.status(400).json({ message: "Currículo deve ser enviado." })

        if (candidato.curriculo != null) {
            fs.unlink("./../../uploads/" + candidato.curriculo, (err) => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        }

        candidato.curriculo = pdf.filename

        await candidatoRepository.save(candidato)

        return response.status(200).json({
            message: "Currículo enviado com sucesso."
        })
    },

    async removeCV(request: Request, response: Response) {
        const { idconta } = request.params;

        const candidatoRepository = AppDataSource.getRepository(Candidato);

        const candidato = await candidatoRepository.findOneBy({ idconta: +idconta });

        if (!candidato)
            return response.status(404).json({ message: "Candidato não encontrado" });

        if (!candidato.curriculo)
            return response.status(400).json({ message: "Você não possui currículo cadastrado." });

        const nomeArquivo = candidato.curriculo;

        // Verificar se outro candidato usa o mesmo currículoj
        const outrosCandidatos = await candidatoRepository.find({
            where: {
                curriculo: nomeArquivo,
                idconta: Not(+idconta)
            }
        });

        // Se nenhum outro candidato usa o mesmo arquivo, deletar o arquivo físico
        if (outrosCandidatos.length === 0) {
            fs.unlink(`./../../uploads/${nomeArquivo}`, (err) => {
                if (err) {
                    console.error("Erro ao deletar arquivo:", err);
                    // Continua mesmo se erro ao deletar
                }
            });
        }

        // Remover referência do currículo no candidato
        candidato.curriculo = null;

        await candidatoRepository.save(candidato);

        return response.status(200).json({
            message: "Currículo removido com sucesso."
        });
    },

    async getCV(request: Request, response: Response) {
        const { idconta } = request.params;

        const candidatoRepository = AppDataSource.getRepository(Candidato);

        const candidato = await candidatoRepository.findOneBy({ idconta: +idconta });

        if (!candidato)
            return response.status(404).json({ message: "Candidato não encontrado" });

        if (!candidato.curriculo)
            return response.status(400).json({ message: "Você não possui currículo cadastrado." });

        const filePath = path.resolve(__dirname, '..', '..', '..', '..', 'uploads', candidato.curriculo);


        return response.sendFile(filePath, (err) => {
            if (err) {
                console.error("Erro ao enviar currículo:", err);
                if (!response.headersSent) {
                    response.status(500).json({ message: "Erro ao buscar o currículo." });
                }
            }
        });
    },

    //FUNÇÃO QUE VERIFICA A EXISTÊNCIA DE UM CPF JÁ CADASTRADO NO BANCO
    async verificarCPFRepetido(request: Request, response: Response) {
        let { cpf } = request.params;
    
        cpf = cpf.replace(/\D/g, '');
    
        const candidatoRepository = AppDataSource.getRepository(Candidato);
    
        try {
            const candidato = await candidatoRepository.findOne({
                where: {
                    cpf,
                    conta: {
                        deletedAt: IsNull()
                    }
                },
                relations: ['conta']
            });
    
            if (candidato) {
                return response.status(200).json({ message: "Já existe um candidato com este CPF" });
            } else {
                return response.status(404).json({ message: "Nenhum candidato encontrado com este CPF" });
            }
        } catch (error) {
            console.error("Erro ao verificar CPF repetido:", error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // FUNÇÃO PARA CRIAR UM NOVO CANDIDATO. VALIDA OS DADOS RECEBIDOS, 
    // VERIFICA SE O CPF É VÁLIDO E SALVA NO BANCO DE DADOS
    async create(request: Request, response: Response) {

        const {
            idconta,
            nome,
            nomeSocial,
            genero,
            cpf,
            nascimento,
            pcd,
            disponibilidade,
            cidadeInteresse,
            tipoVaga,
            pretensaoSalarial,
            nivelInstrucao,
            cnh,
            telefone
        } = request.body

        const dadosObrigatorios = z.object({
            idconta: z.string(),
            nome: z.string(),
            genero: z.string(),
            cpf: z.string().length(11),
            nascimento: z.coerce.date(),
            pcd: z.boolean()
        });

        const dadosOpcionais = z.object({
            disponibilidade: z.string().nullable(),
            cidadeInteresse: z.string().nullable(),
            tipoVaga: z.string().nullable(),
            pretensaoSalarial: z.number().nullable(),
            nivelInstrucao: z.string().nullable(),
            cnh: z.string().max(2).nullable(),
            telefone: z.string().length(11).nullable(),
            nomeSocial: z.string().nullable()
        })

        try {

            dadosObrigatorios.parse({
                idconta,
                nome,
                genero,
                cpf,
                nascimento,
                pcd
            })

            dadosOpcionais.parse({
                disponibilidade,
                cidadeInteresse,
                tipoVaga,
                pretensaoSalarial,
                nivelInstrucao,
                cnh,
                telefone,
                nomeSocial
            });

            if (!isValidCPF(cpf))
                return response.status(400).json({ message: "CPF Inválido" })


            const contaRepository = AppDataSource.getRepository(Conta)
            const candidatoRepository = AppDataSource.getRepository(Candidato)

            const conta = await contaRepository.findOne({
                where: {
                    idConta: +idconta,
                    deletedAt: IsNull()
                }
            })

            const candidato = await candidatoRepository.findOne({
                where: {
                    cpf,
                    conta: {
                        deletedAt: IsNull()
                    }
                },
                relations: ['conta']
            })

            const candidatoComConta = await candidatoRepository.findOne({
                where: {
                    idconta: +idconta
                }
            })

            if (!conta)
                return response.status(404).json({ message: "Não há uma conta com este identificador" })

            if (candidato) {
                return response.status(404).json({ message: "Já existe um candidato com este cpf" })
            }

            if (candidatoComConta)
                return response.status(400).json({ message: "Já existe um candidato utilizando esta conta" })

            const novoCandidato = candidatoRepository.create({
                idconta,
                nome,
                nomeSocial: nomeSocial,
                genero,
                cpf,
                pcd,
                dataNascimento: nascimento,
                disponibilidade,
                cidade: cidadeInteresse,
                tipoVaga,
                pretensaoSalarial,
                nivelInstrucao,
                cnh,
                telefone,
            })

            // novoCandidato.tokenFirebase = generateToken();

            await candidatoRepository.save(novoCandidato)

            return response.status(201).json({
                message: "Candidato criado com sucesso"
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

        // const files = request.files;
        // try {
        //     if (!files) {
        //         return response.status(400).json({ message: "Arquivos não enviados" });
        //     }

        //     // Pega o candidato que esta no body da requisição
        //     let candidatoCriado = JSON.parse(request.body.candidato);
        //     if (candidatoCriado === undefined || !candidatoCriado) {

        //         return response.status(400).json({ message: "candidato não enviado" });
        //     }

        //     const candidatoRepository = AppDataSource.getRepository(Candidato);

        //     // Verifica se já há um candidato com esse CPF
        //     const candidatoCpfExists = await candidatoRepository.findOne({ where: { cpf: candidatoCriado.cpf } });
        //     if (candidatoCpfExists) {
        //         return response.status(400).json({ message: "Já existe um candidato com este cpf cadastrado." });
        //     }
        //     if (!isValidCPF(candidatoCriado.cpf))
        //         return response.status(400).json({ message: "CPF inválido." });

        //     let candidatoCreate = new Candidato();

        //     candidatoCreate.idconta = candidatoCriado.idconta;
        //     candidatoCreate.nome = candidatoCriado.nome;
        //     candidatoCreate.nomeSocial = candidatoCriado.nomeSocial;
        //     candidatoCreate.genero = candidatoCriado.genero;
        //     candidatoCreate.cpf = candidatoCriado.cpf;
        //     candidatoCreate.dataNascimento = candidatoCriado.dataNascimento;
        //     candidatoCreate.telefone = candidatoCriado.telefone;
        //     //files.pcd
        //     if (candidatoCriado.pcd) candidatoCreate.pcd = candidatoCriado.pcd[0].buffer;


        //     const candidato = candidatoRepository.create(candidatoCreate);
        //     await candidatoRepository.save(candidato);

        //     return response.status(201).json(candidato);
        // } catch (error) {
        //     console.log(error)
        //     return response.status(500).json({ message: "Erro interno no servidor" });
        // }
    },

    async index(request: Request, response: Response) {
        try {
            const candidatoRepository = AppDataSource.getRepository(Candidato);
            const candidatos = await candidatoRepository.find({
                relations: {
                    conta: true,
                },
                select: {
                    conta: {
                        email: true,
                        senha: false,
                        deletedAt: true
                    }
                }
            });

            let listaCandidatos: Candidato[] = [];

            // O candidato sempre terá uma conta, pois sua chave primária é uma estrangeira para conta.
            candidatos.forEach(candidato => {
                if (candidato.conta.deletedAt == null)
                    listaCandidatos.push(candidato)
            });

            return response.status(206).json(listaCandidatos);
        } catch (error) {
            console.log(error)
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // LISTA TODOS OS CANDIDATOS
    async indexAll(request: Request, response: Response) {
        const candidatoRepository = AppDataSource.getRepository(Candidato);
        try {
            const candidatos = await candidatoRepository.find();
            return response.status(200).json(candidatos);
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // BUSCA UM CANDIDATO PELO ID
    async findById(request: Request, response: Response) {
        try {

            const { idconta } = request.params;
            if (!idconta) {
                return response.status(400).json({ message: "Id não enviado" });
            }

            const candidatoRepository = AppDataSource.getRepository(Candidato);
            const candidato = await candidatoRepository.findOne({
                where: {
                    idconta: +idconta
                },
                relations: {
                    areas: true
                },
                select: {
                    areas: {
                        idArea: true,
                        nome: true
                    }
                }
            });
            if (!candidato) {
                return response.status(404).json({ message: "Candidato não encontrado" });
            }

            return response.status(200).json(candidato);
        } catch (error) {
            console.log(error)
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // BUSCA UM CANDIDATO PELO NOME SOCIAL
    async findByNomeSocial(request: Request, response: Response) {

        const schema = z.object({
            nome: z.string().min(1)
        })

        try {
            schema.parse(request.params)

            const { nome } = request.params

            if (nome == null) {
                return response.status(400).json({ message: "Nome social não enviado" });
            }

            const candidatoRepository = AppDataSource.getRepository(Candidato);
            const candidatos = await candidatoRepository.find({
                where: {
                    nomeSocial: Like(nome + '%')
                }
            });

            return response.status(200).json(candidatos);
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

    // ATUALIZA DADOS DE UM CANDIDATO
    async update(request: Request, response: Response) {
        const { idconta } = request.params;
        const {
            nome,
            nomeSocial,
            genero,
            cpf,
            nascimento,
            pcd,
            disponibilidade,
            cidadeInteresse,
            tipoVaga,
            pretensaoSalarial,
            nivelInstrucao,
            cnh,
            telefone
        } = request.body

        const schema = z.object({
            nome: z.string(),
            genero: z.string(),
            cpf: z.string().length(11),
            nascimento: z.coerce.date(),
            pcd: z.boolean(),
            disponibilidade: z.string().nullable(),
            cidadeInteresse: z.string().nullable(),
            tipoVaga: z.string().nullable(),
            pretensaoSalarial: z.number().nullable(),
            nivelInstrucao: z.string().nullable(),
            cnh: z.string().max(2).nullable(),
            telefone: z.string().length(11).nullable()
        })

        try {

            schema.parse(request.body)

            const candidatoRepository = AppDataSource.getRepository(Candidato);

            const candidatoExistente = await candidatoRepository.findOneBy({ idconta: +idconta });

            if (!candidatoExistente) {
                return response.status(404).json({ message: "Candidato não encontrado" });
            }

            if (cpf) {
                if (!isValidCPF(cpf)) {
                    return response.status(400).json({ message: "CPF inválido" });
                }
                const candidatoCpfExists = await candidatoRepository.findOne({
                    where: {
                        cpf,
                        idconta: Not(+idconta)
                    }
                });
                if (candidatoCpfExists) {
                    return response.status(400).json({ message: "Candidato com este cpf já cadastrado" });
                }
            }

            candidatoExistente.nome = nome
            candidatoExistente.nomeSocial = nomeSocial
            candidatoExistente.genero = genero
            candidatoExistente.cpf = cpf
            candidatoExistente.dataNascimento = nascimento
            candidatoExistente.pcd = pcd
            candidatoExistente.disponibilidade = disponibilidade
            candidatoExistente.cidade = cidadeInteresse
            candidatoExistente.tipoVaga = tipoVaga
            candidatoExistente.pretensaoSalarial = pretensaoSalarial
            candidatoExistente.nivelInstrucao = nivelInstrucao
            candidatoExistente.cnh = cnh
            candidatoExistente.telefone = telefone

            await candidatoRepository.save(candidatoExistente);

            return response.status(200).json(candidatoExistente);
        } catch (error) {
            console.log(error)
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    //ATUALIZA OS INTERESSES DO CANDIDATO COM OS DADOS FORNECIDOS NA REQUISIÇÃO
    async atualizarInteresses(request: Request, response: Response) {
        const { idconta } = request.params;
        const files = request.files;

        if (!files) {
            return response.status(400).json({ message: "Arquivos não enviados" });
        }

        // Pega o candidato que esta no body da requisição
        let candidatoCompleto = JSON.parse(request.body.candidato);

        try {
            const candidatoRepository = AppDataSource.getRepository(Candidato);

            const candidatoExistente = await candidatoRepository.findOneBy({ idconta: +idconta });

            if (!candidatoExistente) {
                return response.status(404).json({ message: "Candidato não encontrado" });
            }

            /*
            * Aqui chega apenas as informações de interesse que podem ser nulas então verificações
            * como se o CPF já existe não são necessárias, porque atributos únicos não são alterados.
            * Nome, nomesocial, genero, cpf, dataNascimento, pcd são alteradas em outra função.
            * Apenas disponibilidade, cidade, tipoVaga, pretensaoSalarial, nivelInstrucao, cnh e areas são atualizadas aqui.
            */

            if (candidatoCompleto.disponibilidade !== candidatoExistente.disponibilidade)
                candidatoExistente.disponibilidade = candidatoCompleto.disponibilidade;
            //  candidatoExistente.disponibilidade = candidatoCompleto.disponibilidade.join(";");

            if (candidatoCompleto.cidade !== candidatoExistente.cidade)
                candidatoExistente.cidade = candidatoCompleto.cidade;
            //  candidatoExistente.cidade = candidatoCompleto.cidade.join(";");

            if (candidatoCompleto.tipoVaga !== candidatoExistente.tipoVaga)
                candidatoExistente.tipoVaga = candidatoCompleto.tipoVaga;
            //  candidatoExistente.tipoVaga = candidatoCompleto.tipoVaga.join(";");

            if (candidatoCompleto.pretensaoSalarial !== candidatoExistente.pretensaoSalarial)
                candidatoExistente.pretensaoSalarial = candidatoCompleto.pretensaoSalarial;

            if (candidatoCompleto.nivelInstrucao !== candidatoExistente.nivelInstrucao)
                candidatoExistente.nivelInstrucao = candidatoCompleto.nivelInstrucao;

            if (candidatoCompleto.cnh !== candidatoExistente.cnh)
                candidatoExistente.cnh = candidatoCompleto.cnh;

            if (candidatoCompleto.areas !== candidatoExistente.areas)
                candidatoExistente.areas = candidatoCompleto.areas;

            const candidato = candidatoRepository.create(candidatoExistente);
            await candidatoRepository.save(candidato);

            return response.status(200).json(candidatoExistente);
        } catch (error) {
            console.log(error)
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    //MARCA UM CANDIDATO COMO DELETADO
    async delete(request: Request, response: Response) {
        try {
            const { id } = request.params;

            const candidatoRepository = AppDataSource.getRepository(Candidato);

            const candidato = await candidatoRepository.findOneBy({ idconta: +id });

            if (!candidato) {
                return response.status(404).json({ message: "Candidato não encontrado" });
            }

            const now = new Date();
            candidato.deletedAt = now;
            await candidatoRepository.save(candidato);

            return response.status(200).json({ message: "Candidato desativado com sucesso." });
        } catch (error) {
            console.error("Erro ao desativar candidato:", error);
            return response.status(500).json({ message: "Erro interno do servidor" });
        }
    },

    // CADASTRA AS ÁREAS DE INTERESSE PARA UM CANDIDATO
    async cadastrarAreas(request: Request, response: Response) {
        const { idconta } = request.params;
        const { areas } = request.body;

        const idSchema = z.object({
            idconta: z.string({ required_error: "O id é requerido" })
        })

        try {

            idSchema.parse(request.params)

            const candidatoRepository = AppDataSource.getRepository(Candidato);
            const areaRepository = AppDataSource.getRepository(Area);

            const candidato = await candidatoRepository.findOne({
                where: {
                    idconta: +idconta
                }
            });

            if (!candidato) {
                return response.status(404).json({ message: "Candidato não encontrado" });
            }

            // Encontre as áreas pelo nome
            const areasEncontradas = await areaRepository.find({
                where: {
                    nome: In(areas)
                }
            });

            // Verifique se todas as áreas foram encontradas
            if (areas.length !== areasEncontradas.length) {
                return response.status(400).json({ message: "Uma ou mais áreas não foram encontradas" });
            }

            candidato.areas = areasEncontradas;

            await candidatoRepository.save(candidato);

            return response.status(200).json({ message: "Áreas cadastradas com sucesso para o candidato" });

        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // ENVIA EMAIL COM O CURRÍCULO EM PDF PARA UMA VAGA
    async enviarEmailCurriculo(request: Request, response: Response) {
        const { idconta, idvaga } = request.params;
        const pdf = request.file;

        const candidatoRepository = AppDataSource.getRepository(Candidato);
        const candidato = await candidatoRepository.findOne({
            where: {
                idconta: +idconta
            }
        });

        const vagaRepository = AppDataSource.getRepository(Vaga);
        const vaga = await vagaRepository.findOne({
            where: {
                idVaga: +idvaga
            }
        });
        try {
            if (candidato && vaga) {
                await sendEmailCurriculo(pdf, candidato, vaga);

                return response.status(200).json({ message: "Email enviado com sucesso!" });

            } else if (!candidato)
                return response.status(404).json({ message: "Candidato não encontrado" });
            else if (!vaga)
                return response.status(404).json({ message: "Vaga não encontrada" });

        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    async enviarEmailCurriculoDoPerfil(request: Request, response: Response) {
        const { idconta, idvaga } = request.params;

        const candidatoRepository = AppDataSource.getRepository(Candidato);
        const candidato = await candidatoRepository.findOne({
            where: {
                idconta: +idconta
            }
        });

        const vagaRepository = AppDataSource.getRepository(Vaga);
        const vaga = await vagaRepository.findOne({
            where: {
                idVaga: +idvaga
            }
        });
        try {
            if (candidato && vaga) {
                await sendEmailCurriculoDoPerfil(candidato, vaga);

                return response.status(200).json({ message: "Email enviado com sucesso!" });

            } else if (!candidato)
                return response.status(404).json({ message: "Candidato não encontrado" });
            else if (!vaga)
                return response.status(404).json({ message: "Vaga não encontrada" });

        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // BUSCA AS VAGAS PARA AS QUAIS O CANDIDATO SE CANDIDATOU
    async candidaturas(request: Request, response: Response) {
        const { idconta } = request.params;

        if (!idconta) {
            return response.status(400).json({ message: "ID do candidato não fornecido" });
        }

        try {
            const candidatoRepository = AppDataSource.getRepository(Candidato);
            const candidato = await candidatoRepository.findOne({
                where: { idconta: +idconta },
                relations: ["vagas", "vagas.idEmpresa"],  // Inclua "vagas.idEmpresa" para garantir que a empresa seja carregada
            });


            if (!candidato) {
                return response.status(404).json({ message: "Candidato não encontrado" });
            }

            // Retorna as vagas associadas ao candidato
            return response.status(200).json(candidato.vagas);
        } catch (error) {
            console.error(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    // ATUALIZA AS ÁREAS DE INTERESSE DO CANDIDATO NO BANCO DE DADOS
    async atualizarAreasDeInteresse(request: Request, response: Response) {
        const { idconta } = request.params;
        const { areas } = request.body;


        try {
            const candidatoRepository = AppDataSource.getRepository(Candidato);
            const areaRepository = AppDataSource.getRepository(Area);

            const candidato = await candidatoRepository.findOne({
                where: {
                    idconta: +idconta
                }
            });

            if (!candidato) {
                return response.status(404).json({ message: "Candidato não encontrado" });
            }

            // Extrair nomes das áreas
            const nomesAreas = areas.map((area: { nome: string }) => area.nome);

            // Encontre as áreas pelo nome
            const areasEncontradas = await areaRepository.find({
                where: {
                    nome: In(nomesAreas)
                }
            });

            // Verifique se todas as áreas foram encontradas
            if (nomesAreas.length !== areasEncontradas.length) {
                return response.status(400).json({ message: "Uma ou mais áreas não foram encontradas" });
            }

            candidato.areas = areasEncontradas;

            await candidatoRepository.save(candidato);

            return response.status(200).json({ message: "Áreas de interesse atualizadas com sucesso" });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: "Erro interno no servidor" });
        }
    },

    /**
     * Vai salvar o token do firebase no banco de dados a partir do id do candidato informado no cabeçalho da requisição e o token no corpo da requisição
     * @param request
     * @param response
     */
    async setFirebaseToken(request: Request, response: Response) {
        try {

            const { idconta } = request.params;
            const { token } = request.body;

            if (!idconta) return response.status(400).json({ message: "Id não informado" });
            if (!token) return response.status(400).json({ message: "Token não informado" });

            const candidatoRepository = AppDataSource.getRepository(Candidato);

            const candidato = await candidatoRepository.findOneBy({ idconta: +idconta });

            if (!candidato) return response.status(404).json({ message: "Candidato não encontrado" });

            if (candidato.tokenFirebase === token) return response.status(200).json({ message: "Token igual" });

            candidato.tokenFirebase = token;

            await candidatoRepository.save(candidato);


            return response.status(200).json({ message: "Token salvo com sucesso" });

        } catch (error) {
            console.log(error)
            return response.status(500).json({ message: "Erro interno no servidor" });
        }

    }

}

// export default class CandidatoController extends Candidato {

//     /**
//      * Funcao que vai validar se a senha informada é segura
//      * @param senha
//      */
//     validarSenha(senha: string) {
//         const regex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");
//         return regex.test(senha);
//     }

//     /**
//      * Vai salvar o token do firebase no banco de dados a partir do id do candidato informado no cabeçalho da requisição e o token no corpo da requisição
//      * @param request
//      * @param response
//      */
//     async setFirebaseToken(request: Request, response: Response) {
//         try {

//             const { idconta } = request.params;
//             const { token } = request.body;

//             if (!idconta) return response.status(400).json({ message: "Id não informado" });
//             if (!token) return response.status(400).json({ message: "Token não informado" });

//             const candidatoRepository = AppDataSource.getRepository(Candidato);

//             const candidato = await candidatoRepository.findOneBy({ idconta: +idconta });

//             if (!candidato) return response.status(404).json({ message: "Candidato não encontrado" });

//             if (candidato.tokenFirebase === token) return response.status(200).json({ message: "Token igual" });

//             candidato.tokenFirebase = token;

//             await candidatoRepository.save(candidato);


//             return response.status(200).json({ message: "Token salvo com sucesso" });

//         } catch (error) {
//             console.log(error)
//             return response.status(500).json({ message: "Erro interno no servidor" });
//         }

//     }

//     /**
//      * Funcao de teste para enviar uma notificação para um candidato
//      * @param request
//      * @param response
//     async sendNotification(request: Request, response: Response) {
//         try {

//             const {id} = request.params;

//             if (!id) return response.status(400).json({message: "Id não informado"});

//             const candidatoRepository = AppDataSource.getRepository(Candidato);

//             const candidato = await candidatoRepository.findOneBy({idCandidato: +id});

//             if (!candidato) return response.status(404).json({message: "Candidato não encontrado"});

//             if (!candidato.tokenFirebase) return response.status(400).json({message: "Token não informado"});

//             await FirebaseController.sendPushNotificationToToken(candidato.tokenFirebase, "title", candidato.nome);

//             return response.status(200).json({message: "Notificação enviada com sucesso"});

//         }catch (error) {
//             console.log(error)
//             return response.status(500).json({message: "Erro interno no servidor"});
//         }
//     }
//      */

// }