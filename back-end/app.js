require('dotenv').config();
const express = require('express');
const user = require('./models/user');
const userCo = require('./models/userConnectes');
const messageSchem = require('./models/message');

// export one function that gets called once as the server is being initialized
module.exports = function (app, server) {

    const mongoose = require('mongoose');
    mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_URL}/${process.env.DB_NAME}?retryWrites=true&w=majority`,
      { useNewUrlParser: true,
        useUnifiedTopology: true })
      .then(() => console.log('DB is OK'))
      .catch(() => console.log('DB failed'));

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', '*');
        next();
    });

    const io = require('socket.io')(server, {
        cors: {
            origin: "http://127.0.0.1:5500",
            methods: ["GET", "POST"]
        }
    })
    
    app.use(express.json());

        io.on('connection', (socket) =>{
            envoiUserCo();
            let userConnecte = new userCo({login : socket.id})
            userConnecte.save().then(envoiUserCo());
            

            console.log("utilisateur non loggé connecté : " + socket.id)

            socket.on('tryConnection', (loginMdp) => {
                        
                user.findOne({login : loginMdp.login})
                .then(user =>{
                    if(user.mdp == loginMdp.mdp)
                    {
                        console.log("utilisateur valide")
                        socket.emit("ConnectionValide", loginMdp)
                        userConnecte.delete();
                        userConnecte = new userCo({login : loginMdp.login})
                        userConnecte.save().then(envoiUserCo())
                        
                        envoiUserCo()
                    }
                    else{
                        console.log("erreur mdp/connection")
                        socket.emit("ConnectionErreur")
                    }
                }
                    
                )
            })
    
            socket.on('createAccount', (loginMdp) => {
                const newuser = new user({login : loginMdp.login, mdp : loginMdp.mdp});
                newuser.save()
                console.log(newuser + " utilisateur crée")
            })
    
            socket.on('disconnect', () => {
              userConnecte.delete().then(envoiUserCo());
              console.log(`utilisateur non loggé ${socket.id} disconnected`);
              io.emit('notification', `Bye ${socket.id}`);

            socket.on('messageEnvoi', (value) => {
                let aEnvoyer = new messageSchem({
                    message : value,
                    user : userConnecte.login,
                    timestamp : {
                        hours : new Date().getHours,
                        minutes : new Date().getMinutes,
                        seconds : new Date().getSeconds
                    }
                })
                aEnvoyer.save()
            } )

            
        })
        async function envoiUserCo()
        {
            let listeNomUser = []
            await userCo.find().then(liste =>{
                
                liste.forEach(element => {
                    listeNomUser.push(element.login.toString())
                });
                socket.emit('majConnectes', listeNomUser)
            })
        }
    })

    
    // app.use(function (req, res, next) { req.io = io; next(); });

    // app.get('/test', (req, res, next) => {
    //     res.status(200).json({ hello: 'world' })
    // })
}