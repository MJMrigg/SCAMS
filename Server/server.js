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
  response.status(200).sendFile(path.join(directory, "../Client/home.html"));
});

//Mongo information
//const uri = "mongodb+srv://SSEconnection:RememberThis@cluster0.3jlg2.mongodb.net/"; //Old database
const uri = "mongodb+srv://evanhambre:R0SEBID25@cluster0.zlbvlpq.mongodb.net/";

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
    var startTime = Date.now(); //Get start and end times to calculate rtt
    var result = await collection.find(document).toArray();
    var endTime = Date.now();
    var rtt = endTime-startTime;
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
    document.rtt = rtt; //Add sever-database request rtt to document
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
    var startTime = Date.now(); //Get start and end times to calculate rtt
    var result = await collection.find(document).toArray();
    var endTime = Date.now();
    var rtt = endTime - startTime;
    //Update document
    if(result[0] == undefined){ //If the document was not in the database, return null
      document = {result: false};
    }else{ //If the document was in the database, return all of the user's data
      document = {result: true};
    }
    document.rtt = rtt; //Add server-database request rtt to document
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
    var startTime = Date.now(); //Get start and end times to calculate rtt
    var result = await collection.find(document).toArray();
    var endTime = Date.now();
    var rtt = endTime-startTime; 
    //Update document
    if(result[0] == undefined){ //If the document was not in the database, return null
      document = {result: false};
    }else{ //If the document was in the database, return all of the user's data
      document = {result: true};
    }
    document.rtt = rtt;
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
    var startTime = Date.now(); //Use start and end time to get rtt
    var result = await collection.find(document).sort({highScore:-1}).limit(10).toArray();
    var endTime = Date.now();
    var rtt = endTime - startTime;
    //Add all 10 scores and their unsernames to the document, along with the rtt
    document = {};
    for(let i = 0; i < Math.min(result.length, 10); i++){ //Just in case there are less then 10 scores in the database
      document["highScore"+i] = result[i].highScore;
      document["username"+i] = result[i].username;
    }
    document.rtt = rtt;
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
          user: "cybereducationgame@gmail.com",
          pass: "zejv ocaw bgac inhb"
          //www.youtube.com/watch?v=fF-07yFTq5o
          //2FA must be on for this to work
        },
      });
      //Create email information
      const mailOptions = {
        from: 'riggmatthew25@gmail.com',
        to: result[0].email,
        subject: 'SCAMS User Information Request',
        text: 'Hello '+result[0].username+"!\n\nWe were recently made aware that you requested your account information. You will find that information below:\n\nUsername: "+result[0].username+"\nPassword: "+result[0].password+"\n\nIf you did not request this information, it may mean that your account has been compromised. We suggest you login and change your information right away, as well as respond to this email so that we can know about any issues we may have in our security system.\n\nHave a great day!\n\n-SCAMS"
      };
      //Send the email
      result = await transporter.sendMail(mailOptions);
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
  var startTime = Date.now(); //Get start and end times to calculate rtt
	var questions = await collection.find(filter).toArray();
  var endTime = Date.now();
  var rtt = endTime - startTime;
  questions.push(rtt); //Add server-database rtt to response
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
  var startTime = Date.now(); //Get start and end times to calculate rtt
	const questions = await collection.find(filter).toArray();
  var endTime = Date.now();
  var rtt = endTime - startTime;
	//return questions;
  questions.push(rtt); //Add server-database rtt to response
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
  var startTime = Date.now(); //Get start and end times to calculate rtt
	var questions = await collection.find({}).toArray();
  var endTime = Date.now();
  var rtt = endTime - startTime;
	//return questions;
  questions.push(rtt); //Add server-database rtt to response
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
  var startTime = Date.now(); //Get start and end times to calculate rtt
	const questions = await collection.find({}).toArray();
  var endTime = Date.now();
  var rtt = endTime - startTime;
  questions.push(rtt); //Add server-database rtt to response
	//return questions;
  response.status(200).json(questions);
  }catch(err){
    console.error(`[Error] ${err}`);
  }finally{
    //Close Mongo
    await client.close();
  }
});

//Getb the question for a stage in the smishing level
app.post("/getSmishing", async(request, response) => {
  var data = request.body;
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to run queries with mongo
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "SmishingBank"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Get the data for that stage
    //Create the document to be sent to mongo
    var document = {
      stage: {$eq: data.stage}
    };
    //Send document to mongo and store result as array
    var startTime = Date.now(); //Get start and end times to calculate rtt
    var result = await collection.find(document).toArray();
    var endTime = Date.now();
    var rtt = endTime - startTime;
    //Update document with data from result
    document = {
      stage: result[0].stage,
      arrows: result[0].arrows,
      losingText: result[0].losingText,
      takeaway: result[0].takeaway
    };
    //Return the document
    document.rtt = rtt; //Add server-database rtt to response
    response.status(200).json(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }
});

app.post("/getSmishingAll", async(request, response) => {

  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to run queries with mongo
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "SmishingBank"
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Send document to mongo and store result as array
    var startTime = Date.now(); //Get start and end times to calculate rtt
    var result = await collection.find({}).toArray();
    var endTime = Date.now();
    var rtt = endTime - startTime;
    //Update document with data from result
    var document = {};
    for(var i = 0; i < result.length; i++){
      document["Question"+i] = result[i];
    }
    //Return the document
    document.rtt = rtt; //Add server-database rtt to response
    response.status(200).json(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }
});

app.get("/getAllPermissions", async(request, response) => {
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to run queries on mongo
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "PermissionsBank";
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Get all of the questions from the permissions bank
    var startTime = Date.now(); //Get start and end time to calculate RTT
    var result = await collection.find({}).toArray();
    var endTime = Date.now();
    var rtt = startTime - endTime;

    //Place result into a json document along with server-database rtt
    var document = {
      questions: result,
      rtt: rtt
    }
    
    //Return the document
    response.status(200).send(document);
  }catch(err){
    console.error(`[Error]: ${err}`);
  }
});

//Get the questions for the Permissions level
app.post("/getPermissions", async(request, response) => {
  //Get body data
  var data = request.body;
  //Connect to MongoDB
  const client = new MongoClient(uri);
  await client.connect();
  //Try to run queries on mongo
  try{
    //Connect to the proper database and collection
    var dataBase = "SSE_MobileSecurityGame";
    var dbCollection = "PermissionsBank";
    const db = client.db(dataBase);
    const collection = db.collection(dbCollection);

    //Get data for which questions to fetch
    //Each stage has 5 questions. So to get the questions for that stage, multiply the stage by 5
    //Then ask for all questions less then or equal to the that number
    //Then retrieve the first five questions
    var highestQuestion = data.stage*5;
    var limit = 5;
    if(highestQuestion > 50){ //If this is the last question, only retrive it alone
      limit = 1;
    }
    var startTime = Date.now(); //Get start and end time to calculate RTT
    var result = await collection.find({question:{$lte: highestQuestion}}).sort({question:-1}).limit(limit).toArray();
    var endTime = Date.now();
    var rtt = startTime - endTime;

    //Place result into a json document along with server-database rtt
    var document = {
      questions: result,
      rtt: rtt
    }
    
    //Return the document
    response.status(200).send(document);
  }catch(err){
    console.error(`[Error] ${err}`);
  }
});

//Begin the server on port 3000
app.listen(3000, () => {
  console.log('Server listening on Port 3000');
});