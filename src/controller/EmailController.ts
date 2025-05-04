import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs'
import path from 'path';

// CARREGANDO AS VARIÁVEIS DE AMBIENTE DO ARQUIVO .ENV
dotenv.config(
    {
        path: __dirname + "/../.env"
    }
);

// CONFIGURAÇÃO DO TRANSPORTE DE E-MAIL USANDO NODEMAILER
const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "noreply.pepvagas@gmail.com",
        pass: "lhak hzlk yuvz ungr"
    },
    tls: {
        rejectUnauthorized: false
    }

});

// FUNÇÃO PARA GERAR UMA SENHA ALEATÓRIA
function generatePassword() {
    const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseLetters = lowercaseLetters.toUpperCase();
    const numbers = '0123456789';
    const specialCharacters = '!@#$%^&*_';

    const allCharacters = lowercaseLetters + uppercaseLetters + numbers + specialCharacters;

    const getRandomChar = (characters: string | any[]) => characters[Math.floor(Math.random() * characters.length)];

    const getRandomFrom = (characters: string | any[], count: number) => Array.from({ length: count }, () => getRandomChar(characters)).join('');

    const password = [
        getRandomChar(lowercaseLetters),
        getRandomChar(uppercaseLetters),
        getRandomChar(numbers),
        getRandomChar(specialCharacters)
    ].join('') + getRandomFrom(allCharacters, 4);

    return password.split('').sort(() => Math.random() - 0.5).join(''); // randomly shuffle
}

// FUNÇÃO PARA ENVIAR UM E-MAIL DE RECUPERAÇÃO DE SENHA
async function sendEmail(email: string, password: string) {

    const mailOptions = {
        from: 'noreply.pepvagas@gmail.com',
        to: email,
        subject: 'PEPVagas - Recuperação de senha',
        html: `
        <div style="background-color: #f2f2f2; padding: 20px; font-family: Arial, Helvetica, sans-serif;">
        <h1 style="color: #f2f2f2; font-size: 24px; text-align: center; background-color: #333; padding: 10px;">PEPVagas</h1>
        <p style="color: #333; font-size: 18px;">Sua nova senha é:</p>
        <div style="display: flex; justify-content: center; align-items: center; font-size: 24px; margin-top: 20px;">${password}</div>
        <p style="color: #333; font-size: 16px;">Mantenha sua nova senha segura e lembre-se de alterá-la para uma senha forte e única.</p>
        <div style="display: flex; justify-content: center; align-items: center; margin-top: 20px;">
            <p style="color: #333; font-size: 14px;">Este é um e-mail automático, não responda.</p>
        </div>
    </div>
      `

    };

    transport.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email enviado: ' + info.response);
        }
    });
}

// FUNÇÃO PARA ENVIAR CURRÍCULO VIA E-MAIL
async function sendEmailCurriculo(curriculo: any, candidato: any, vaga: any) {
    try {

        let nome = candidato.nome;
        if (candidato.nomeSocial)
            nome = candidato.nomeSocial
        
        const titulo_vaga = vaga.titulo;
        const email = vaga.emailCurriculo;
        const mailOptions = {
            from: 'noreply.pepvagas@gmail.com',
            to: email,
            subject: 'PEPVagas - Envio de currículo',
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Candidatura - ${nome}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
        
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                }
        
                h1, p {
                    text-align: center;
                }
        
                img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                }
        
                .highlight {
                    background-color: #15842a;
                    color: #ffffff;
                    padding: 5px;
                    border-radius: 5px;
                }
        
                .attachment-instructions {
                    background-color: #15842a;
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 20px;
                }
        
                .footer {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #15842a;
                    color: #ffffff;
                    text-align: center;
                }
        
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1> Candidato interessado em vaga </h1>
                <p>O candidato(a) ${nome} está interesado na vaga: ${titulo_vaga}</p>
                <p>O curriculo está em anexo.</p>
            </div>
        </body>
        </html>
      `,
            attachments: [
                {
                    filename: 'curriculo.pdf',
                    content: curriculo
                }
            ]

        };

        transport.sendMail(mailOptions, (error: any, info: any) => {
            if (error) {
                console.log("Erro: " + error);
            } else {
                console.log('Email enviado: ' + info.response);
            }
        });
    } catch (error) {
        console.log(error);
    }
}

// FUNÇÃO PARA ENVIAR CURRÍCULO DIRETO DO PERFIL DO CANDIDATO
async function sendEmailCurriculoDoPerfil(candidato: any, vaga: any) {
    try {

        let nome = candidato.nome;
        if (candidato.nomeSocial)
            nome = candidato.nomeSocial

        const filePath = path.resolve('../../uploads/', candidato.curriculo);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.log(err);
                return;
            }

            const curriculo = data;

            const titulo_vaga = vaga.titulo;
            const email = vaga.emailCurriculo;
            const mailOptions = {
                from: 'noreply.pepvagas@gmail.com',
                to: email,
                subject: 'PEPVagas - Envio de currículo',
                html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Candidatura - ${nome}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
        
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                }
        
                h1, p {
                    text-align: center;
                }
        
                img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                }
        
                .highlight {
                    background-color: #15842a;
                    color: #ffffff;
                    padding: 5px;
                    border-radius: 5px;
                }
        
                .attachment-instructions {
                    background-color: #15842a;
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 20px;
                }
        
                .footer {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #15842a;
                    color: #ffffff;
                    text-align: center;
                }
        
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1> Candidato interessado em vaga </h1>
                <p>O candidato(a) ${nome} está interesado na vaga: ${titulo_vaga}</p>
                <p>O curriculo está em anexo.</p>
            </div>
        </body>
        </html>
      `,
                attachments: [
                    {
                        filename: 'curriculo.pdf',
                        content: curriculo
                    }
                ]

            };

            transport.sendMail(mailOptions, (error: any, info: any) => {
                if (error) {
                    console.log("Erro: " + error);
                } else {
                    console.log('Email enviado: ' + info.response);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }

}

// FUNÇÃO PARA ENVIAR UMA NOTIFICAÇÃO POR E-MAIL PARA O CANDIDATO
async function sendEmailNotification(candidato: any, vaga: any, url: any, message: any) {
    let cabecalho = '';
    if (message == 'perfeita') {
        message = " uma empresa está oferencendo uma vaga que é perfeita para você";
        cabecalho = "PEPVagas - Vaga perfeita para você";
    } else {
        message = " uma empresa está oferencendo uma vaga que é de seu interesse para você";
        cabecalho = "PEPVagas - Vaga de interesse para você";
    }

    const mailOptions = {
        from: 'noreply.pepvagas@gmail.com',
        to: candidato.email,
        subject: cabecalho,
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Candidatura - Seu Nome</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
        
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                }
        
                h1, p {
                    text-align: center;
                }
        
                img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                }
        
                .highlight {
                    background-color: #15842a;
                    color: #ffffff;
                    padding: 5px;
                    border-radius: 5px;
                }
        
                .attachment-instructions {
                    background-color: #15842a;
                    color: #ffffff;
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 20px;
                }
        
                .footer {
                    margin-top: 20px;
                    padding: 10px;
                    background-color: #15842a;
                    color: #ffffff;
                    text-align: center;
                }
        
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Vaga de interesse para você</h1>
                <p>Olá ${candidato.nome}, ${message}</p>
                <ul>
                    <li>Titulo: ${vaga.titulo_vaga}</li>
                    <li>Descrição: ${vaga.descricao}</li>
                    <li>Salario: ${vaga.salario}</li>
                    <li>Local: ${vaga.local}</li>
                    <li>${vaga.maisInfo}</li>
                </ul>
            </div>
        </body>
        </html>
        `

    }

    transport.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
            console.log("Erro: " + error);
        } else {
            console.log('Email enviado: ' + info.response);
        }
    });

}

export { generatePassword };
export { sendEmail };
export { sendEmailCurriculo };
export { sendEmailCurriculoDoPerfil };
export { sendEmailNotification };