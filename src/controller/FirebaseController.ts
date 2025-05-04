import admin from "firebase-admin";
import * as serviceAccount from "../../firebase-sdk.json";

/** Classe responsavel por enviar notificações para o firebase */
export default class FirebaseController {

//     admin.initializeApp({
//                             credential: admin.credential.cert(serviceAccount as any),
// }, 'PEPVagas');
//
// console.log(admin)


    static pepvagasApp = admin.initializeApp({
        credential: admin.credential.cert(<any>serviceAccount),
    }, 'PEPVagas');



    /** Construtor */



    /** Inicializa o firebase */


    /** Envia push notification para o firebase a partir de uma lista de tokens */
    static async sendPushNotification(tokens: string[], title: string, body: string) {
        try {

            const message = {
                notification: {
                    title,
                    body
                },
                tokens
            }

            const messaging = this.pepvagasApp.messaging();

            const response = await messaging.sendEachForMulticast(message);

            console.log("Successfully sent message:", response)

        }catch (e) {
            console.log(e)
        }
    }

    /** Envia push notification para o firebase a partir de um token */
    static async sendPushNotificationToToken(token: string, title: string, body: string) {

        try {
            const message = {
                notification: {
                    title,
                    body
                },
                token
            }

            const messaging = this.pepvagasApp.messaging();

            const response = await messaging.send(message);

            console.log("Successfully sent message:", response)
        } catch (e) {
            console.log(e)
        }

    }

    /** Cadastra um token a um topico */
    static async subscribeToTopic(token: string, topic: string) {
        try {

            const messaging = this.pepvagasApp.messaging();
            await messaging.subscribeToTopic(token, topic);

        }catch (e) {
            console.log(e)
        }
    }

    /** Remove um token de um topico */
    static async unsubscribeFromTopic(token: string, topic: string) {
        try {

            const messaging = this.pepvagasApp.messaging();
            await messaging.unsubscribeFromTopic(token, topic);

        }catch (e) {
            console.log(e)
        }
    }

    /** Envia uma notificação para um topico */
    static async sendPushNotificationToTopic(topic: string, title: string, body: string) {
        try {

            const messaging = this.pepvagasApp.messaging();
            const message = {
                notification: {
                    title,
                    body
                },
                topic
            }

            const response = await messaging.send(message);

            console.log("Successfully sent message:", response)

        }catch (e) {
            console.log(e)
        }
    }


}