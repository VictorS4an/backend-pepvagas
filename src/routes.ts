import { Router } from "express";
import AdminController from "./controller/AdminController";
import AreaController from "./controller/AreaController";
import EquipeController from "./controller/EquipeController";
import authentication from "./middleware/authentication";
import TipoServicoController from "./controller/TipoServicoController";
import ContaController from "./controller/ContaController";
import AuthController from "./controller/AuthController";
import CandidatoController from "./controller/CandidatoController";
import VagaController from "./controller/VagaController";
import RepresentanteController from "./controller/RepresentanteController";
import EmpresaController from "./controller/EmpresaController";
import uploadConfig from './config/multer'
import multer from "multer";
import ProfissionalLiberalController from "./controller/ProfissionalLiberalController";

const routes = Router();
const upload = multer(uploadConfig)  

/* Auth */
routes.post("/login", AuthController.login)

/* Conta */
routes.get("/conta", ContaController.index)
routes.get("/conta/:id", ContaController.getById)
routes.get("/contas/deletadas", ContaController.indexDeleted)
routes.post("/conta", ContaController.create)
routes.put("/conta/senha/:id", ContaController.updatePassword)
routes.put("/conta/email/:id", ContaController.updateEmail)
routes.delete("/conta/:id", ContaController.delete)
routes.post("/conta/recuperacao", ContaController.recuperarSenha)
routes.get("/conta/email/:email", ContaController.getByEmail)

/* Administrador */
routes.post("/admin", AdminController.create);
routes.get("/admin", AdminController.index);
routes.put("/admin/:id", AdminController.update);
routes.get("/admin/:id", authentication.validate, AdminController.find);
routes.delete("/admin/:id", authentication.validate, AdminController.delete);

/* Equipe */
routes.post("/equipe", EquipeController.create);
routes.get("/equipe", EquipeController.index);
routes.put("/equipe/:id", EquipeController.update);
routes.get("/equipe/:id", EquipeController.find);
routes.delete("/equipe/:id", EquipeController.delete);

/* Candidato */
routes.post("/candidato", CandidatoController.create);
routes.post("/candidato/cv/:idconta", upload.single('pdf'), CandidatoController.sendCV)
routes.delete("/candidato/cv/delete/:idconta", CandidatoController.removeCV)
routes.get('/candidato/cv/get/:idconta', CandidatoController.getCV)
routes.post("/candidato/areas/:idconta", CandidatoController.cadastrarAreas)
routes.get("/candidato", CandidatoController.index)
routes.get("/candidato/deletados", CandidatoController.indexAll)
routes.get("/candidato/:idconta", CandidatoController.findById)
routes.get("/candidato/social/:nome", CandidatoController.findByNomeSocial)
routes.put("/candidato/:idconta", CandidatoController.update)
routes.put("/candidato/interesses/:idconta", CandidatoController.atualizarInteresses)
routes.put("/candidato/areas/editar/:idconta", CandidatoController.atualizarAreasDeInteresse)
routes.delete("/candidato/:id", CandidatoController.delete)
routes.get("/candidato/:idconta/candidaturas", CandidatoController.candidaturas);
//Novas rotas para candidato:
routes.get("/candidato/cpf/:cpf", CandidatoController.verificarCPFRepetido)


/* Area */
routes.post("/area/create", AreaController.create);
routes.get("/area/find/:id", AreaController.findById);
routes.get("/area/list", AreaController.index);
routes.delete("/area/delete/:id", AreaController.delete);
routes.put("/area/update/:id", AreaController.update);

/* Tipo Servico */
routes.post("/tipo-servico/create", TipoServicoController.create);
routes.get("/tipo-servico/find/:id", TipoServicoController.findById);
routes.get("/tipo-servico/list", TipoServicoController.index);
routes.get("/tipo-servico/profissionais/:id", TipoServicoController.findProfissionais);
routes.delete("/tipo-servico/delete/:id", TipoServicoController.delete);
routes.put("/tipo-servico/update/:id", TipoServicoController.update);

// /* Profissional Liberal */
routes.post("/profissional-liberal/create",ProfissionalLiberalController.create);
routes.post("/profissional-liberal/sendimage/:idconta", upload.single('imagem'), ProfissionalLiberalController.sendImage);
routes.post("/profissional-liberal/tipo/:idconta", ProfissionalLiberalController.cadastroTipo);
routes.get("/profissional-liberal/index", ProfissionalLiberalController.index);
routes.get("/profissional-liberal/index-all", ProfissionalLiberalController.indexAll);
routes.get("/profissional-liberal/findById/:id", ProfissionalLiberalController.findById);
routes.get("/profissional-liberal-buscar-tipo/:idconta", ProfissionalLiberalController.findTipoByProfissionalId);
routes.put("/profissional-liberal/update/:id", ProfissionalLiberalController.update);
routes.delete("/profissional-liberal/delete/:id", ProfissionalLiberalController.delete);

// /*Empresa */
routes.post("/empresa", EmpresaController.create);
routes.get("/empresa", EmpresaController.index);
routes.delete("/empresa/:id", EmpresaController.delete);
routes.put("/empresa/:id",EmpresaController.update);
routes.get("/empresa/:id",EmpresaController.findById);
routes.get("/empresa/representantes/:id", EmpresaController.getRepresentantesByEmpresaId);
//Novas rotas para empresa: 
routes.get("/empresa/cnpj/:cnpj", EmpresaController.verificarCNPJRepetido)

/* Vaga */
routes.post("/vaga/", VagaController.create)
routes.post("/candidatar/:idconta/:idVaga", VagaController.candidatar);
routes.post("/vaga/sendLogoAndBanner/:idvaga", upload.fields([{ name: 'logo' }, { name: 'banner' }]), VagaController.sendLogoAndBanner)
routes.get("/vaga", VagaController.index)
routes.get("/vaga/:idVaga", VagaController.findById)
routes.get("/vaga/conta/:id", VagaController.findByIdConta)
routes.put("/vaga/:idVaga", VagaController.update)
routes.delete("/vaga/:idVaga", VagaController.delete)

// /* Representante */
routes.post("/representante", RepresentanteController.create);
routes.get("/representante",RepresentanteController.index);
routes.delete("/representante/:id", RepresentanteController.delete);
routes.put("/representante/:id", RepresentanteController.update);
routes.get("/representante/:id",RepresentanteController.findById);
routes.get("/representante/:id",RepresentanteController.findById);
routes.get("/representante/:id/empresa", RepresentanteController.getEmpresaByRepresentante); 
routes.get("/vaga/representante/:idRepresentante", VagaController.vagasDoRepresentante);

routes.post("/enviarEmailComCurriculo/:idconta/:idvaga", upload.single('pdf'), CandidatoController.enviarEmailCurriculo)
routes.post("/enviarEmailComCurriculoDoPerfil/:idconta/:idvaga", CandidatoController.enviarEmailCurriculoDoPerfil)

export default routes;
