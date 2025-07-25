import express from "express";
//DO NOT UNDER ANY CIRCUMSTANCES REMOVE THE BRACKETS!!! BAD THINGS WILL HAPPEN!!!
import {MongoClient} from "mongodb";
import {fileURLToPath} from 'url';
import path from 'path';
import nodemailer from 'nodemailer';

//Create an express application to handle communications between the front end and back end
const app = express();
//Allow the app to pass json and urlencoded data into the mongo functions
app.use(express.json());
//Allow the app to interact with files in the entire directory
const file = fileURLToPath(import.meta.url);
const directory = path.dirname(file);
app.use(express.static(path.join(directory, "..")));

//Begin the program at the home file
app.get("/", (request, response) => {
  response.status(200).sendFile(path.join(directory, "Client/home.html"));
});

//Mongo information
//const uri = "mongodb+srv://SSEconnection:RememberThis@cluster0.3jlg2.mongodb.net/"; //Old database
const uri = "mongodb+srv://evanhambre:R0SEBID25@cluster0.zlbvlpq.mongodb.net/"

//Create an account via a post request based on the parameters in the request and send the account data back via a response
app.post("/createAccount", async(request, response) => {
  var data = request.body; //Get user data
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to insert account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "Testing"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Create the primary key
    var result = await collection.countDocuments(); //Get the count of how may users exist in database
    //Check to make sure the user Ids were retrieved
    if(result.acknowledged){
      throw new Error("Error: Failed to get new UserId.");
    }
    var newUserId = result + 1; //Create the new user_id by adding one to the count

    //Insert new data
    //Create a new document
    var document = {
      user_id: newUserId,
      username: data.username,
      email: data.email,
      password: data.password,
      permissionsLevelStage: data.permissionsLevelStage,
      smishingLevelStage: data.smishingLevelStage,
      highScore: 0,
      scores: []
    };
    if(data.firstScore > 0){ //If the player already had a score, add it to the scores array
      document.scores.push(data.firstScore);
      document.highScore = data.firstScore;
    }
    //Insert the document data into the database
    result = await collection.insertOne(document);
    //Make sure it worked
    if (result.acknowledged) {
      response.status(200).json(document); //Send the data back to the frontend
    } else {
      throw new Error(`Failed to insert data`);
    }

  } catch (err) {
    console.error(`[Error] ${err}`);
  } finally {
    //Close Mongo
    await client.close();
  }
});

//Retrieve data via a post request based on the parameters in the request and send the retrieved data back via a response
app.post("/login", async(request, response) =>{
  var data = request.body;
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "Testing"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Create document to be sent to mongo
    var document = {
      username: {$eq: data.username},
      password: {$eq: data.password}
    };
    //Send document to mongo and store result
    var result = await collection.find(document).toArray();
    //Update document
    if(result[0] == undefined){ //If the document was not in the database, return null
      document = {
        user_id: null,
      };
    }else{ //If the document was in the database, return all of the user's data
      document = {
        user_id: result[0].user_id,
        username: result[0].username,
        email: result[0].email,
        password: result[0].password,
        highScore: result[0].highScore,
        scores: result[0].scores,
        permissionsLevelStage: result[0].permissionsLevelStage,
        smishingLevelStage: result[0].smishingLevelStage
      };
    }
    //Return the document
    response.status(200).json(document);

  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Update data via a post request based on the parameters in the request and send the updated data back via a response
app.post("/update", async(request,response) =>{
  var data = request.body;
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "Testing"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Create document to be sent to mongo
    var document = { 
      $set: {
        username: data.username, 
        email: data.email, 
        password: data.password, 
        highScore: data.highScore,
        scores: data.scores
	    }
    };
    //Filter to know which document to update in mongo
    var filter = {
      user_id: data.user_id
    };
    //Send document to mongo and store result
    var result = await collection.updateOne(filter,document);
    //Fetch data again
    result = await collection.find({user_id: data.user_id}).toArray();
    //Update document
    document = {
      username: result[0].username,
      email: result[0].email,
      password: result[0].password,
      highScore: result[0].highScore,
      scores: result[0].scores,
      permissionsLevelStage: data.permissionsLevelStage,
      smishingLevelStage: data.smishingLevelStage,
    }
    //Return the document
    response.status(200).json(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Retrieve a username via a post the request and send true or false if that username exists through the reponse
app.post("/checkUsername",async(request,response)=>{
  var data = request.body;
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "Testing"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Create document to be sent to mongo
    var document = {
      username: {$eq: data.username}
    };
    //Send document to mongo and store result
    var result = await collection.find(document).toArray();
    //Update document
    if(result[0] == undefined){ //If the document was not in the database, return null
      document = {result: false};
    }else{ //If the document was in the database, return all of the user's data
      document = {result: true};
    }
    //Return the document
    response.status(200).json(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Retrieve a username via a post the request and send true or false if that username exists through the reponse
app.post("/checkEmail",async(request,response)=>{
  var data = request.body;
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "Testing"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Create document to be sent to mongo
    var document = {
      email: {$eq: data.email}
    };
    //Send document to mongo and store result
    var result = await collection.find(document).toArray();
    //Update document
    if(result[0] == undefined){ //If the document was not in the database, return null
      document = {result: false};
    }else{ //If the document was in the database, return all of the user's data
      document = {result: true};
    }
    //Return the document
    response.status(200).json(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Get the top 10 highest scores and send the scores back via a response
app.post("/getScoreBoard", async(request,response) =>{
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "Testing"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Create document to be sent to mongo
    var document = {};
    //Send document to mongo and store result
    var result = await collection.find(document).sort({highScore:-1}).limit(10).toArray();
    //Add all 10 scores and their unsernames to the document
    document = {};
    for(let i = 0; i < Math.min(result.length, 10); i++){ //Just in case there are less then 10 scores in the database
      document["highScore"+i] = result[i].highScore;
      document["username"+i] = result[i].username;
    }
    //Return the document
    response.status(200).json(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Send the client their password to their email should they forget it
app.post("/forgot", async(request, response) => {
  var data = request.body;
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to run queries with mongo
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "Testing"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //See if the email the user provided is in the system
    var document = {
      email: {$eq: data.email}
    };
    //Send document to mongo and store result as array
    var result = await collection.find(document).toArray();
    //Check the result and update the document accordingly
    if(result[0] == undefined){ //If there was no result, it means there is not account with that email
      document = {result: 0};
    }else{ //If there was a result, it means there was an account with that user
      document = {result: 1};
      //Create transporter with sender information
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "riggmatthew25@gmail.com",
          pass: "" //Need create password
          //www.youtube.com/watch?v=fF-07yFTq5o
        },
      });
      //Create email information
      const mailOptions = {
        from: 'riggmatthew25@gmail.com',
        to: 'evanhambre@gmail.com',
        subject: 'SCAMS User Information Request',
        text: 'Hello '+result[0].username+"!\n\nWe were recently made aware that you requested your account information. You will find that information below:\n\nUsername: "+result[0].username+"\nPassword: "+result[0].password+"\n\nIf you did not request this information, it may mean that your account has been compromised. We suggest you login and change your information right away, as well as respond to this email so that we can know about any issues we may have in our security system.\n\nHave a great day!\n\n-SCAMS"
      };
      //Send the email
      result = await transporter.sendMail(mailOptions);
      console.log(result);
      //Need create email for SCAMS
    }
    //Return the document
    response.status(200).json(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }
});

//for the question banks


//Vishing voicemail level question bank
app.post("/getVishing", async(request,response) =>{
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "VishingBank"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);
	var filter = {type: "voicemail"};
	const questions = await collection.find(filter).toArray();
	//return questions;
	response.status(200).json(questions);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Vishing call level question bank
app.post("/getVishingCall", async(request,response) =>{
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "VishingBank"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);
	var filter = {type: "call"};
	const questions = await collection.find(filter).toArray();
	//return questions;
	response.status(200).json(questions);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Phishing level question bank
app.post("/getPhishing", async(request,response) =>{
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "PhishingBank"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);
	const questions = await collection.find({}).toArray();
	//return questions;
	response.status(200).json(questions);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//CommonAttack question bank
app.post("/getCommon", async(request,response) =>{
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to retrieve account data
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "CommonAttackBank"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);
	const questions = await collection.find({}).toArray();
	return questions;
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Begin the server on port 3000
app.listen(3000, () => {
  console.log('Server listening on Port 3000');
});