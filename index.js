const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fmftb.mongodb.net/burjAlArab?retryWrites=true&w=majority`;


const app = express();
console.log(process.env.DB_PASS)
app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require('./configs/burj-al-arab-9e967-firebase-adminsdk-cs4nl-b1edfa95f5.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
    console.log(newBooking)
  })

  app.get('/bookings', (req, res) => {
    // console.log(req.headers.authorization)
    const bearer = req.headers.authorization;



    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];

      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail)
          if (tokenEmail == req.query.email) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents)
              })
          }
           else{
            res.status(401).send('un authorized accessed')
           }
        })

        .catch((error) => {
          res.status(401).send('un authorized accessed')
        });

    }
    // idToken comes from the client app
    else{
      res.status(401).send('un authorized accessed')
    }


  })

})


app.listen(5000);