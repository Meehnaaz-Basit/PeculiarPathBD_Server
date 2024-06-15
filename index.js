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
    // booking collection
    const bookingsCollection = client
      .db("peculiarpathsbd")
      .collection("bookings");

    // story collection
    const storyCollection = client.db("peculiarpathsbd").collection("stories");
    // ************ jwt *********
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });

    // ***** verify middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Forbidden Access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // verify admin after token
    const verifyAdmin = async (req, res, next) => {
      const email = req.body.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";

      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // ********* admin ********

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    //

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );
    // ********* admin ********

    // verify guide after token
    const verifyGuide = async (req, res, next) => {
      const email = req.body.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isGuide = user?.role === "guide";

      if (!isGuide) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };
    //
    app.get("/users/guide/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      let guide = false;
      if (user) {
        guide = user?.role === "guide";
      }
      res.send({ guide });
    });

    // ********* guide ********
    app.patch(
      "/users/guide/:id",
      verifyToken,
      verifyGuide,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "guide",
          },
        };
        const result = await usersCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );
    // ********* guide ********

    // get all user
    app.get("/users", async (req, res) => {
      // console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
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
    // update user (guide)
    // Update user profile endpoint
    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedProfile = req.body; // Updated profile data from frontend

      try {
        const query = { email: email };
        const updateDoc = {
          $set: updatedProfile,
        };

        const result = await usersCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 1) {
          res.status(200).send({ message: "Profile updated successfully" });
        } else {
          res.status(404).send({ error: "User not found" });
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send({ error: "Internal server error" });
      }
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

    // get all tour guides **********************--------
    // app.get("/tourGuides", async (req, res) => {
    //   const result = await tourGuidesCollection.find().toArray();
    //   res.send(result);
    // });

    // // get tour guide by id ************************--------------
    app.get("/tourGuides/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    // tour guide by email
    app.get("/tourGuides/email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // *******************************
    // get all guides
    app.get("/tourGuides", async (req, res) => {
      try {
        const query = { role: "guide" };
        const tourGuides = await usersCollection.find(query).toArray();
        res.send(tourGuides);
      } catch (error) {
        console.error("Error fetching guides:", error);
        res.status(500).send("Error fetching guides");
      }
    });

    // *******************************
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
    // post user story from front end to db
    app.post("/usersStory", async (req, res) => {
      const newItem = req.body;
      const result = await storyCollection.insertOne(newItem);
      res.send(result);
    });
    // user story
    app.get("/usersStory", async (req, res) => {
      const result = await storyCollection.find().toArray();
      res.send(result);
    });
    app.get("/usersStory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await storyCollection.findOne(query);
      res.send(result);
    });

    // bookings
    // post package from front end to db
    app.post("/bookings", async (req, res) => {
      const newItem = req.body;
      newItem.status = "In Review";
      const result = await bookingsCollection.insertOne(newItem);
      res.send(result);
    });
    // get booking by email
    app.get("/bookings/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });
    //all bookings
    app.get("/bookings", async (req, res) => {
      const result = await bookingsCollection.find().toArray();
      res.send(result);
    });
    // DELETE a booking by ID
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await bookingsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        console.log(`Delete result: ${JSON.stringify(result)}`); // Log the result
        if (result.deletedCount === 1) {
          res.status(200).send({
            message: "Booking deleted successfully",
            deletedCount: result.deletedCount,
          });
        } else {
          res.status(404).send({ error: "Booking not found" });
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).send({ error: "Internal server error" });
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
