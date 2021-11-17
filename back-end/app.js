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
            //Je crée un nom anonyme + random (pas très solide mais c'est pour l'exemple !!)
            let r = Math.floor(Math.random() * 9999)
            let userConnecte = new userCo({login : "anonyme"+r})

            //On met a jour les utilisateurs connectés
            userConnecte.save().then(envoiUserCo);

            envoiMessages()

            console.log("utilisateur non loggé connecté : " + socket.id)


            //Lors d'un essai de connexion
            socket.on('tryConnection', (loginMdp) => {
                        
                user.findOne({login : loginMdp.login})
                .then(user =>{
                    if(user.mdp == loginMdp.mdp)
                    {
                        console.log("utilisateur valide")
                        io.emit("ConnectionValide", loginMdp)
                        userConnecte.delete();
                        userConnecte = new userCo({login : loginMdp.login})
                        userConnecte.save().then(envoiUserCo)
                        
                    }
                    else{
                        console.log("erreur mdp/connection")
                        io.emit("ConnectionErreur")
                    }
                }
                    
                )
            })
    
            socket.on('createAccount', (loginMdp) => {
                const newuser = new user({login : loginMdp.login, mdp : loginMdp.mdp});
                newuser.save()
                console.log(newuser + " utilisateur crée")
                
                io.emit("UtilisateurCree")
            })
    
            socket.on('disconnect', () => {
              userConnecte.delete().then(envoiUserCo);
              console.log(`utilisateur non loggé ${socket.id} disconnected`);
              io.emit('notification', `Bye ${socket.id}`);
              envoiUserCo()
            })
            //Lorsqu'un message est envoyé
            socket.on('messageEnvoi', (value) => {
                let date = new Date()
                let aEnvoyer = new messageSchem({
                    message : value,
                    user : userConnecte.login,
                    timeStamp : {
                        hours : date.getHours(),
                        minutes : date.getMinutes(),
                        seconds : date.getSeconds()
                    }
                })

                aEnvoyer.save().then( x =>
                    messageSchem.find().then(liste =>{
                        io.emit('majMessage', liste)
                        
                        envoiUserCo()
                    })
                    
                )

                
            } )

        function envoiMessages()
        {
            messageSchem.find().then(liste =>{
                io.emit('majMessage', liste)
            })
            
        }

        
        async function envoiUserCo()
        {
            let listeNomUser = []
            let listeUser = await userCo.find()
            listeUser.forEach(async(element) =>  {
                let nbr = await listeUtiliateur(element.login);
                listeNomUser.push(element.login.toString() + `(${nbr})`);

                io.emit('majConnectes', listeNomUser);
            });
        }

        async function listeUtiliateur(user)
        {
            return await messageSchem.countDocuments({user  : user})
          
        }
    })

    
    // app.use(function (req, res, next) { req.io = io; next(); });

    // app.get('/test', (req, res, next) => {
    //     res.status(200).json({ hello: 'world' })
    // })
}