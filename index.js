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
    // wishList collection
    const wishListCollection = client
      .db("peculiarpathsbd")
      .collection("wishList");
    const requestCollection = client
      .db("peculiarpathsbd")
      .collection("request");

    //*************************************************************************
    // ************ jwt *********
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });

    // Middleware to verify JWT token
    const verifyToken = (req, res, next) => {
      console.log("Inside verify token", req.headers);
      if (!req.headers.authorization) {
        return res
          .status(401)
          .send({ message: "Unauthorized: No token provided" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden: Invalid token" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Middleware to ensure admin access
    const ensureAdminAccess = async (req, res, next) => {
      const email = req.decoded.email;
      try {
        const user = await usersCollection.findOne({ email: email });
        if (!user || user.role !== "admin") {
          return res
            .status(403)
            .send({ message: "Forbidden: Admin access required" });
        }
        next();
      } catch (error) {
        console.error("Error verifying admin:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    };

    // Get admin status for a user
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      try {
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        const isAdmin = user.role === "admin";
        res.send({ admin: isAdmin });
      } catch (error) {
        console.error("Error fetching admin status:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Update user role to admin
    app.patch(
      "/users/admin/:id",
      verifyToken,
      ensureAdminAccess,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
            // requestedRole: false,
          },
        };
        try {
          const result = await usersCollection.updateOne(filter, updatedDoc);
          if (result.modifiedCount > 0) {
            res.json({ message: "User role updated to admin successfully" });
          } else {
            res.status(404).json({ message: "User not found" });
          }
        } catch (error) {
          console.error("Error updating user role to admin:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      }
    );

    // Get guide status for a user
    app.get("/users/guide/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      try {
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        const isGuide = user.role === "guide";
        res.send({ guide: isGuide });
      } catch (error) {
        console.error("Error fetching guide status:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Update user role to guide
    app.patch(
      "/users/guide/:id",
      verifyToken,
      ensureAdminAccess,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "guide",
          },
        };
        try {
          const result = await usersCollection.updateOne(filter, updatedDoc);
          if (result.modifiedCount > 0) {
            res.json({ message: "User role updated to guide successfully" });
          } else {
            res.status(404).json({ message: "User not found" });
          }
        } catch (error) {
          console.error("Error updating user role to guide:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      }
    );

    // Get all users
    app.get("/users", async (req, res) => {
      try {
        const result = await usersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Get user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      try {
        const result = await usersCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "User not found" });
        }
        res.send(result);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Create a new user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      try {
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "User already exists", insertedId: null });
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    // Update user profile
    app.patch("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const updatedProfile = req.body;

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

    //*************************************************************************

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
    // post bookings from front end to db
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
    // Update booking status (Accept or Reject)
    app.patch("/bookings/:id/status", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: status,
          },
        };

        const result = await bookingsCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 1) {
          res
            .status(200)
            .send({ message: `Booking status updated to ${status}` });
        } else {
          res.status(404).send({ error: "Booking not found" });
        }
      } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    // get booking by tourGuide email
    app.get("/bookings/tour-guide/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const result = await bookingsCollection.find().toArray();

        //
        const filteredBookings = result.filter((booking) => {
          const tourGuideDetails = booking.tourGuide.split(", ");
          const tourGuideEmail = tourGuideDetails[1];
          return tourGuideEmail === email;
        });

        res.send(filteredBookings);
      } catch (error) {
        console.error("Error fetching bookings by tour guide email:", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    // wishList *** ****
    // post bookings from front end to db
    // Example: Handle POST request to /wishList endpoint
    // app.get("/wishList/:email/:itemId", async (req, res) => {
    //   const { email, itemId } = req.params;

    //   try {
    //     const existingItem = await wishListCollection.findOne({
    //       email,
    //       itemId,
    //     });

    //     if (existingItem) {
    //       return res.status(200).json({ exists: true });
    //     } else {
    //       return res.status(200).json({ exists: false });
    //     }
    //   } catch (error) {
    //     console.error("Error checking wishlist:", error);
    //     res.status(500).send("Internal Server Error");
    //   }
    // });
    // GET route to fetch all wishlist items for a user
    app.get("/wishList/:email", async (req, res) => {
      const { email } = req.params;

      try {
        const wishListItems = await wishListCollection
          .find({ email })
          .toArray();
        res.status(200).json(wishListItems);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // POST route to add an item to the wishlist
    app.post("/wishList/:email", async (req, res) => {
      const { email } = req.params;
      const { itemId, title } = req.body;

      try {
        // Check if the item already exists in the wishlist for the user
        const existingItem = await wishListCollection.findOne({
          email,
          itemId,
        });

        if (existingItem) {
          return res
            .status(400)
            .json({ message: "Item already saved in wishlist" });
        }

        // Insert the new item into the wishlist
        const result = await wishListCollection.insertOne({
          email,
          itemId,
          title,
        });

        res.status(201).json({ message: "Item added to wishlist", result });
      } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.delete("/wishList/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await wishListCollection.deleteOne({
          _id: new ObjectId(id),
        });
        console.log(`Delete result: ${JSON.stringify(result)}`);
        if (result.deletedCount === 1) {
          res.status(200).send({
            message: "WishList removed successfully",
            deletedCount: result.deletedCount,
          });
        } else {
          res.status(404).send({ error: "WishList not found" });
        }
      } catch (error) {
        console.error("Error deleting wishList", error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    // ****************
    // request to admin

    app.post("/request", async (req, res) => {
      const newItem = req.body;
      const result = await requestCollection.insertOne(newItem);

      //
      await usersCollection.updateOne(
        { email: newItem.email },
        { $set: { requestedRole: true } }
      );

      res.send(result);
    });

    // Get all users who have requested a role
    app.get("/request", async (req, res) => {
      try {
        const result = await usersCollection
          .find({ requestedRole: true })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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
