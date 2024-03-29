const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middle ware

app.use(cors());
app.use(express.json());

function verifyJwt(req, res, next) {
  const authHEader = req.headers.authorization;
  if (!authHEader) {
    return res.status(401).send({ message: "unauthorized user" });
  }
  const token = authHEader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKE, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

// database connection
//name: assignment11
//pass: odCfWseqJ17Mh5fw

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSS}@cluster0.nvnfe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
//assync function

async function run() {
  try {
    await client.connect();
    const dataCollection = client.db("datas").collection("data");

    //get

    app.get("/data", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log(page, size);
      const querry = {};
      const cursor = dataCollection.find(querry);
      let result;
      if (page) {
        result = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        result = await cursor.toArray();
      }
      res.send(result);
    });

    //get with single id

    app.get("/data/:id", async (req, res) => {
      const id = req.params.id;
      const querry = { _id: ObjectId(id) };
      const result = await dataCollection.findOne(querry);
      res.send(result);
    });

    //get with same email

    app.get("/personaldata", verifyJwt, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const querry = { email: email };
        const cursor = dataCollection.find(querry);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });

    //delte

    app.delete("/data/:id", async (req, res) => {
      const id = req.params.id;
      const querry = { _id: ObjectId(id) };
      const result = await dataCollection.deleteOne(querry);
      res.send(result);
    });

    //post data from ui

    app.post("/data", async (req, res) => {
      const newUser = req.body;
      const result = await dataCollection.insertOne(newUser);
      res.send(result);
    });

    //put
    app.put("/data/:id", async (req, res) => {
      const id = req.params.id;
      const oldQuantity = parseInt(req.query.oldQuantity);
      console.log(oldQuantity);
      const uUser = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const uDoc = {
        $set: {
          quantity: parseInt(uUser.quantity) + parseInt(oldQuantity),
        },
      };
      const result = await dataCollection.updateOne(filter, uDoc, options);
      res.send(result);
    });

    //decrising one by one

    app.put("/datas/:id", async (req, res) => {
      const id = req.params.id;
      const oldQuantity = parseInt(req.query.oldQuantity);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const uDoc = {
        $set: {
          quantity: parseInt(oldQuantity) - 1,
        },
      };
      const result = await dataCollection.updateOne(filter, uDoc, options);
      res.send(result);
    });

    //paganation api

    app.get("/productCount", async (req, res) => {
      const query = {};
      const cursor = dataCollection.find(query);
      const count = await cursor.count();
      res.send({ count });
    });

    //jwt bujinai tao korbo
    //auth

    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKE, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
// cheek api link

app.get("/", (req, res) => {
  res.send("hello mama ami aci");
});

app.listen(port, () => {
  console.log("assignment 11 server is running at port", port);
});
