const express = require("express");
const cors = require("cors");
const app = express();
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

    // tour guide collection
    const tourGuidesCollection = client
      .db("peculiarpathsbd")
      .collection("tourGuides");

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
