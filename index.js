const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.jzmmeq8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // packages collection
    const pakagesCollection = client
      .db("peculiarpathsbd")
      .collection("pakages");
    // tourType collection
    const tourTypeCollection = client
      .db("peculiarpathsbd")
      .collection("tourType");
    // user collection
    const usersCollection = client.db("peculiarpathsbd").collection("users");

    // tour guide collection
    const tourGuidesCollection = client
      .db("peculiarpathsbd")
      .collection("tourGuides");

    // ********* admin ********
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // ********* admin ********
    // ********* guide ********
    app.patch("/users/guide/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "guide",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // ********* guide ********

    // get all user
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // *** users****
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get all packages
    app.get("/packages", async (req, res) => {
      const result = await pakagesCollection.find().toArray();
      res.send(result);
    });

    // get individual package by id
    app.get("/packages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await pakagesCollection.findOne(query);
      res.send(result);
    });

    // post package from front end to db
    app.post("/packages", async (req, res) => {
      const newItem = req.body;
      const result = await pakagesCollection.insertOne(newItem);
      res.send(result);
    });

    // get all tour guides
    app.get("/tourGuides", async (req, res) => {
      const result = await tourGuidesCollection.find().toArray();
      res.send(result);
    });

    // get tour guide by id
    app.get("/tourGuides/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tourGuidesCollection.findOne(query);
      res.send(result);
    });

    // get all tourType
    app.get("/tourType", async (req, res) => {
      const result = await tourTypeCollection.find().toArray();
      res.send(result);
    });

    // get packages by tour type category
    app.get("/packages/tour-type/:tourType", async (req, res) => {
      try {
        const tourType = req.params.tourType;
        const query = { tour_type: tourType };

        const result = await pakagesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching packages by tour_type:", error);
        res.status(500).send("Error fetching packages by tour_type");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("welcome to PeculiarPathsBd");
});

app.listen(port, () => {
  console.log(`server is running in port ${port}`);
});
