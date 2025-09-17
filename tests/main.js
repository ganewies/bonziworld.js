const bonziworldjs = require('../dist/index');
const BU = require('./bu');

// Génère un client de manière asynchrone
async function createClient() {
    const client = new bonziworldjs.BonziClient(BU.generateRandomString(14));

    // Quand connecté, envoie un message puis se déconnecte
    client.on('connected', () => {
        console.log(`${client.username} connected`);
        setTimeout(() => {
            client.leave();
        }, 250); // Laisse le temps d’envoyer le message
    });
}

// Boucle avec délai pour éviter stack overflow
function loopClients(times, delay = 2000) {
    let count = 0;
    const interval = setInterval(() => {
        if (count >= times) return clearInterval(interval);
        createClient();
        count++;
    }, delay);
}

loopClients(75, 300);
loopClients(75, 250);
