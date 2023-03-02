require("dotenv").config();
const express = require('express');
const jwt = require("jsonwebtoken") ;
const app  = express() ;
const port = process.env.PORT || 4030; 
const mongoose = require("mongoose").set("strictQuery", true);
const mongoDB_url = process.env.mongodb_url;
const cors = require("cors") ; 
app.use(express.json()) ;
app.use('*', cors());

//database connection start with mongoDB 

const options = { useNewUrlParser: true, useUnifiedTopology: true  }
mongoose
  .connect(mongoDB_url, options)
  .then(() =>  console.log("Successfully connected with mongoDB !! "))
  .catch(error => {
    throw error
  });

//database connection start with mongoDB 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const client = new MongoClient(mongoDB_url, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const booksCollection = client.db("book-store").collection("books");
const usersCollection = client.db("book-store").collection("users");

// database connection end with mongoDB  

//verify token
const verifyToken = (req , res , next ) => {
  const token = req.headers.authentication ; 
  const getToken = token.split(" ")[1] ;
 jwt.verify(getToken , process.env.token , (error , decodedData) => {
  if(error) {
      return res.status(403).send({message:"unauthorize access"}) ;
  }  
      req.decodedData = decodedData ;
      next() ;
 })
  }   

// get books

app.get("/getBooks" , async (req , res)  => {
const page =  parseInt(req.query.page) ; 
const size = parseInt(req.query.size );
const cursor =  booksCollection.find({});
const count = await booksCollection.estimatedDocumentCount();
const data = await cursor.skip(page * size).limit(size).sort({_id: -1 }).toArray();
const paginationInfo = {data:data , count:count} ;
return res.send(paginationInfo) ;
}) ; 

//myBooks
app.get("/myBooks" , async (req , res)  => {
const page =  parseInt(req.query.page) ; 
const size = parseInt(req.query.size );
const email = req.query.email ;
const cursor =  booksCollection.find({email:email});
const count = await booksCollection.count({email:email});
const data = await cursor.skip(page * size).limit(size).sort({_id: -1 }).toArray();
const paginationInfo = {data:data , count:count} ;
return res.send(paginationInfo) ;
}) ;
 
//add book
app.post("/addBook" , async (req, res) => {
const insertingData = req.body ;
const result = await booksCollection.insertOne(insertingData) ;
res.status(201).send(result) ;
});  

//edit book
app.put("/editBook" , verifyToken , async (req, res) => {
const updateData = req.body ;
const option = {upsert:true} ;
const id = req.query.id ;
const query = {_id:new ObjectId(id)} ;
const updatedDocument = {
  $set:{
    isbn:updateData.isbn,
    title:updateData.title,
    author:updateData.author,
    description:updateData.description,
    published_year:updateData.published_year,
    publisher:updateData.publisher,
    bookName:updateData.bookName,
    bookImage:updateData.bookImage, 
    updated_date:updateData.date
  }
} 
//check user
const decodedEmail = req.decodedData?.email ;
const findEmail =  await booksCollection.findOne({email:decodedEmail}) ;
const email = req.query.email ;
if(findEmail?.email === decodedEmail) {
  const result = await booksCollection.updateOne(query , updatedDocument , option) ;
  res.status(201).send(result) ;
}else{
  res.status(403).send("ERROR") ;
}

})

app.get("/bookData/:id" , async (req ,res) => {
  const id = req.params.id ;
  const resut = await booksCollection.findOne({_id: new ObjectId(id)}) ;
  res.status(201).send(resut) ;
  })

  // delete book

  app.delete("/deleteBooks", verifyToken,  async(req, res) => {
   const id = req.query.id ;
   const email = req.query.email ;
   const decodedEmail = req.decodedData?.email ;
   const query = {_id : new ObjectId(id)} ;
    //check user
   if(email === decodedEmail) {
    const result = await booksCollection.deleteOne(query) ;
    res.status(201).send(result) ;
  }else{
    res.status(403).send("ERROR") ;
  }
  });
  //create new user
  app.post("/users" , async(req , res) => {
   const insertingData = req.body ;
   const findData  = await usersCollection.findOne({email:req.body.email}) ;
   if(findData){
    return res.status(400).send("existed") ;
   }else{
   const result = await usersCollection.insertOne(insertingData) ;
   return res.status(201).send(result) ;
   }
  });
  //get user datar
    app.get("/users" , async(req , res) => {
      const page =  parseInt(req.query.page) ; 
      const size = parseInt(req.query.size );
      const cursor =  usersCollection.find();
      const count = await usersCollection.estimatedDocumentCount();
      const data = await cursor.skip(page * size).limit(size).sort({_id: -1 }).toArray();
      const paginationInfo = {data:data , count:count} ;
      return res.send(paginationInfo) ;
     })
  
  //database connection end with mongoDB 
  
  // create jwt token 
  app.post("/jwt" , async(req, res) => {
  const email = req.body ;
  const token =  jwt.sign(email , process.env.token  , {expiresIn:"3d"}) ;
  res.status(201).send({token:token}) ;
  })
  app.get("/", (req, res) => {
      res.send("This is home page")
  }); 
  
   // >>----------------->>
  
  app.listen(port, (req, res) => {
      console.log(`Server runing on port number: ${port}`);
  });
  