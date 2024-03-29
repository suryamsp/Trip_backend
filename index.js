// const express = require("express"); // "type": "commonjs"
import express from "express"; // "type": "module"
import bcrypt from "bcrypt";
import { hash } from "bcrypt";

// Now you can use the hash() function directly

import cors from 'cors';
import { MongoClient } from "mongodb";
import  jwt  from "jsonwebtoken";
import { authe } from "./middleware/auth.js";
import * as dotenv from 'dotenv';


dotenv.config()

const app = express();
const PORT = process.env.PORT; // Default to 3000 if PORT is not set in the environment
const mongo_url = process.env.MONGO_URL;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// app.use((request, response, next) => {
//   response.header('Access-Control-Allow-Origin', 'http://localhost:5173');
//   response.header('Access-Control-Allow-Origin','https://nxttrip.netlify.app');
//   response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   response.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });


export const client = new MongoClient(mongo_url);


try {
    await client.connect();
    console.log("MongoDB is connected");
} catch (error) {
    console.error("Error connecting to MongoDB:", error);
}





app.get("/Triplist", async function (request, response) {
  const list= await client
  .db("Tripdb")
  .collection("addlist")
  .find({})
  .toArray();
  response.send(list);
});

app.get("/Triplist/:names", async function (request, response) {
  const names = request.params.names; // Correct way to access parameter value
  const list = await client
    .db("Tripdb")
    .collection("addlist")
    .findOne({ trip_name: names });

  response.send(list);
});
app.get("/Updatelist/:namess", async function (request, response) {
  const namess = request.params.namess; // Correct way to access parameter value
  const list = await client
    .db("Tripdb")
    .collection("updatelist")
    .findOne({ trip_name: namess });

  response.send(list);
});


app.get("/Updatelist", async function (request, response) {
  const list= await client
  .db("Tripdb")
  .collection("updatelist")
  .find({})
  .toArray();
  response.send(list);
});

app.get("/Addnotes", async function (request, response) {
  const list= await client
  .db("Tripdb")
  .collection("addnotes")
  .find({})
  .toArray();
  response.send(list);
});

app.get("/member",async function (request, response) {
  const list= await client
  .db("Tripdb")
  .collection("login")
  .find({})
  .toArray();
  response.send(list);
});


app.delete("/:name", async function (request, response) {
  const { name } = request.params;
;
  const deletelist = await Deletelist(name);
  deletelist.deletedCount >= 1
    ? response.send({ message: "delete movie suessfully" }) : response.status(404).send(`movie not found`);
});

 async function Deletelist (name) {
  return await client
  .db("Tripdb")
  .collection("addlist")
  .deleteOne({trip_name:name});
}

app.delete("/delete/:data", async function (request, response) {
  const { data } = request.params;
  const deletenote = await Deletenote(data);
  deletenote.deletedCount >= 1
    ? response.send({ message: "delete movie suessfully" }) : response.status(404).send(`movie not found`);
});

 async function Deletenote (data) {
  return await client
  .db("Tripdb")
  .collection("addnotes")
  .deleteOne({title:data});
}

app.delete("/member/:title", async function (request, response) {
  const { title } = request.params;

  const deletenote = await Deletemember(title);
  deletenote.deletedCount >= 1
    ? response.send({ message: "delete movie suessfully" }) : response.status(404).send(`movie not found`);
});

 async function Deletemember (title) {
  return await client
  .db("Tripdb")
  .collection("login")
  .deleteOne({username:title});
}




app.post("/Add_trip",async function (req, response) {
  const {trip_name,status,description,image}= req.body;
  
  const results = await Add_trip({
      trip_name: trip_name,
      status:      status,
      description: description,
      image: image,
      
  });
  response.send(results);
});

app.put("/edit/:titles",async function (req, response) {
  const {titles}= req.params;
  const {title,notes}= req.body;
  console.log(titles);
  const updateresult = await  Updatenotes(titles,{
    title:title,
    notes:notes,
  });
  updateresult
    ? response.send(updateresult)
    : response.status(404).send(`note not found`);
});

async function Updatenotes(titles,data) {
  return await client
    .db("Tripdb")
    .collection("addnotes")
    .updateOne({title:titles},{$set:data});
}

app.post("/Add_notes",async function (req, response) {
  const {title,notes,date}= req.body;
  
  const results = await Add_notes({
      title:title,
      notes:notes,
      date:date,
      
  });
  response.send(results);
});

async function Add_notes(data) {
  return await client
    .db("Tripdb")
    .collection("addnotes")
    .insertOne(data);
}

app.post("/update_trip",async function (req, response) {
  const {trip_name,city,str_date,end_date,route,website,budjet,member,command}= req.body;
  
  const results = await Update_trip({
      trip_name: trip_name,
      city:      city,
      str_date:      str_date,
      end_date:      end_date,
      route:      route,
      budjet:      budjet,
      member:      member,
      command:      command,
      
  });
  response.send(results);
});

async function Add_trip(data) {
  return await client
    .db("Tripdb")
    .collection("addlist")
    .insertOne(data);
}

async function Update_trip(data) {
  return await client
    .db("Tripdb")
    .collection("updatelist")
    .insertOne(data);
}

app.post("/signup", async function (request, response) {
  const {name, email, newpassword}= request.body;

  const userfrondb = await getUsername(name);
  if(userfrondb){
    response.status(400).send({message:"username alreadyy exit"})
  } else{
    const hashedpassword = await gen_password(newpassword);
    const result = await createUsers({
      username: name,
      Email: email,
      password: hashedpassword,
      
    });
    response.send(result);
  }
 
});
app.post("/login", async function (request, response) {
  const {name, password}= request.body;
  const userfromdb = await getUsername(name);

  if(!userfromdb){
    response.status(400).send({message:"invalid"})
  }
  else{
    const storedPassword =  userfromdb.password;

    const checkStoredPassword = await bcrypt.compare(password, storedPassword);

   
    if(checkStoredPassword){
      const token = jwt.sign({username: name},"suryamsp")
      response.send({message:"succssful login", token:token});
    }else{
      response.status(400).send({message:"invalid credentials"});
    }
  } 
});


async function createUsers(data) {
  return await client
    .db("Tripdb")
    .collection("login")
    .insertOne(data);
}

async function gen_password(newpassword){
  const no_round=10;
  const salt = await bcrypt.genSalt(no_round);
  const hashedpassword = await bcrypt.hash(newpassword, salt);
  // console.log(salt);
  // console.log(hashedpassword);
  return hashedpassword;
}

async function getUsername(name) {
  return await client
    .db("Tripdb")
    .collection("login")
    .findOne({ username:name});
}




app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
