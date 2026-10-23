const express = require('express');
const app = express();
const jwt = require("jsonwebtoken");
const {authmiddleware} = require("./middleware");
const path = require("path");
app.use(express.json());
const mongoose = require("mongoose");

const cookieParser = require("cookie-parser");
const cors = require("cors");
app.use(cookieParser());
app.use(cors({ origin : "http://localhost:3000/", credentials : true}));
const {userModel,orgModel,boardModel, ticketModel} = require("./databases");




const USERS = [];
var userId = 1;

// {
//         username : "sohail",
//         userId : 1
//         orgname : "zept",
//         description : "a company",
//         orgId : orgId++,
//         members = []
// }

const ORGANISATIONS = [ ];
var orgId = 1;
// const obj = {
//     username: 'sohail',
//     userId: 1,
//     orgname: 'Xepto',
//     orgId: 1,
//     description: 'Company',
//     members: []
//   };

const BOARDS = [];
var boardId = 1;
const TICKETS = [];
var ticketId = 1;

app.post("/signup",async (req,res,next)=>{
    const username = req.body.username;
    const password = req.body.password;

    // const exists = USERS.find(user => user.username === username);
    const exists = await userModel.findOne({ username : username});
    console.log(exists);
    if(exists){
        res.send([ "user already exists"]);
        return;
    }
    // USERS.push({ username : username, password : password, userId : userId++});
    const object = await userModel.create({ username : username , password : password});
    res.send({
        message : "user created",
        _id : object._id

    });
    next();
})

app.post("/signin", async(req,res,next)=>{
    const username = req.body.username;
    const password = req.body.password;
    // const exists = USERS.find(user => user.username === username && user.password === password);
    const exists = await userModel.findOne({ username : username, password : password});
    if(!exists){
        res.send({message : "user does not exists , Invalid credentials"});
        return;
    }
    const token = jwt.sign({username : username },"my-secret-key");
    res.cookie("token",token);
    res.send({ message : "user logged in..", token : token, _id : exists._id });
    next();
})


app.post("/create-organisation",authmiddleware,async(req,res,next)=>{
    const username = req.username;
    const userId = req.userId;
    if(!username){
        return res.send({ message : "invalid username"});
    }

    const orgname = req.body.orgname;
    const description = req.body.description;
    if(!orgname || !description){
        return res.send({ message : "required field missing"});
    }

    // const orgexists = ORGANISATIONS.find(orgs => orgs.orgname === orgname);
    const orgexists = await orgModel.findOne({orgname : orgname });
    if(orgexists){
        res.send({message : "org with name already exists "});
        return;
    }
    // const exists = USERS.find(user => user.username === username);
    // const id = USERS.find(user => user.username === username)?.userId;
    const exists = await userModel.findOne({ username : username});

    if(!exists){
        res.send({ message : "malfunctioned token or user doesnot exists"});
        return;
    }

    // const org = {
    //     username : username,
    //     userId : id,
    //     orgname : req.body.orgname,
    //     orgId : orgId++,
    //     description : req.body.description,
    //     members : []
    // }
    // ORGANISATIONS.push(org);
    // console.log(ORGANISATIONS);
    const org = await orgModel.create({ 
        orgname :orgname, 
        description : description,
        admin : userId,
        members : []
    })
    res.send({ message : org, orgId : org._id});
});


app.put("/add-member/:orgId",authmiddleware,async (req,res,next)=>{
    const username = req.username;
    const userId = req.userId;

    if(!username || !userId){
        res.send({message : "malfunctioned token"});
        return;
    }

    // find organisation 
    const id = req.params.orgId;
    console.log(id);
    // console.log("req orgid :",id);
    // const existorg = ORGANISATIONS.find(orgs => orgs.orgId === id);
    const existorg = await orgModel.findOne({ _id : id });
    console.log(existorg);
    if(!existorg){
        res.send({ message : "organisation id does not exists"});
        return;
    }

    // find newuse in usertable
    const newuser = req.body.member;
    const finduser = await userModel.findOne({ username : newuser});
    if(!finduser){
        return res.send({message : "not a registerd user"});
    }

    // check for admin
    // const admin = existorg.username;
    const orgadmin = existorg.admin;
    console.log("orgadmi : ",orgadmin, "userId", userId);
    if(orgadmin != userId){
        res.send({ message : "you are not the admin"});
        return;
    }

    // check new member is already exists in org
    // const addedmember = req.body.member;
    // const memberexists = USERS.find(user => user.username === addedmember);
    const members = existorg.members;
    console.log("finduser._id ", finduser);
    const exists = members.find(i => i === finduser._id);
    console.log("member exist in org", exists);
    if(exists){
        res.send({ message : "memeber already exists in org"});
        return;
    }
    const newmember = await orgModel.updateOne(
        {_id : id}, { $push : { members : finduser._id}}
    );
   
    res.send({ "added new member" :  finduser._id});
    
})



app.get("/signup",(req,res)=>{
    res.sendFile(path.join(__dirname,"signup.html"));
})

app.get("/signin",(req,res)=>{
    res.sendFile(path.join(__dirname,"signin.html"));
})

app.get("/create-organisation",(req,res)=>{
    res.sendFile(path.join(__dirname,"createorg.html"));
});

app.get("/show-org",(req,res,next)=>{
    res.sendFile(path.join(__dirname,"showorg.html"));
})

app.get("/get-organisations",authmiddleware,async (req,res)=>{
    const username = req.username;
    const userId = req.userId;

    // const user = USERS.find(user => user.username === username); 
    console.log("username , id ", username, userId); 
    if(!username || !userId){
        res.send({ message : "malfunctioned token"});
        return;
    }
    // const arr = ORGANISATIONS.filter(org => org.username === username);
    const orgs = await orgModel.find({ admin : userId});

    res.send(orgs);

})

app.delete("/delete-organisation/:orgId",authmiddleware, async (req,res,next)=>{
    const username = req.username;
    const orgId  = req.params.orgId;
    // const org = await orgModel.find({ admin : username, _id : orgId});
    const org = await orgModel.deleteOne({ _id : orgId });
    if(!org){
        return res.send({ message : "org doesnot exist"});
    }
    res.send({ deleted : org});


})

app.get("/get-members/:orgId",authmiddleware, async (req,res,next)=>{
    const username = req.username;
    const orgId  = req.params.orgId;

    // find org
    // const findOrg = ORGANISATIONS.find(obj => obj.orgId === orgId);
    const findorg = await orgModel.findOne({_id : orgId});
    

    console.log("findorg : ", findorg);
    if(!findorg){
        return res.send({ message : "org doesn't exists"});
    }
    const members = findorg.members;
    console.log("members : ",members);
    res.send({members});
})

app.delete("/delete-member/:userId",authmiddleware,async (req,res,next)=>{
    const username = req.username;
    const userId = req.params.userId;
    console.log("userid : ", userId);
    const orgname = req.body.orgname;
    console.log("orgname : ",orgname);

    // find org
    // const findOrg = ORGANISATIONS.find(obj => obj.orgname === orgname);
    const findOrg = await orgModel.findOne({ orgname : orgname });

    if(!findOrg){
        return res.send({ message : "not a valid org"});
    }

    // find a members is present in org members
    // const members = findOrg.members;
    // const presentIndex = members.findIndex(p => p == userId);
    const members = findOrg.members;
    const checkIsPresent = members.find(i => i == userId );
    if(!checkIsPresent){
        return res.send({ message : "member is not present in org"});
    }

    // const remove = members.splice(presentIndex,1);
    const removemember = await orgModel.updateOne({ _id : findOrg._id}, { 
        $pull : {  members : userId}
    });
    res.send({ "deleted member" : removemember});
    
})

app.post("/dashboard/:orgId",authmiddleware,async (req,res,next)=>{
    const username = req.username;
    const orgId = req.params.orgId;
    // find org
    // const findorg = ORGANISATIONS.find(obj => obj.orgId === orgId);
    const findorg = await orgModel.findOne({ _id : orgId});
    

    if(!findorg){
        return res.send({ message : "invalid organisationId"});
    }

    
    const boardname = req.body.title;
    const boarddescription = req.body.description;
    if(!boardname || !boarddescription){
        return res.send({ message : "required field missing"});
    }
    
    // const boardObj = {
    //     board : boardname,
    //     description : boarddescription,
    //     orgname : findorg.orgname,
    //     orgId : orgId,
    //     username : username,
    //     boardId : boardId++,
    //     tickets : [],
    // }
    const board = await boardModel.findOne({ title : boardname});
    if(board){
        return res.send({ already_exist : board});
    }
    const id = findorg._id;
    const newboard = await boardModel.create( {
        title : boardname,
        description : boarddescription,
        orgId : id,
        createdBy : req.userId,
        tickets : []
    })
    res.send({ message : newboard });
})

app.post("/add-ticket/:boardId",authmiddleware,async (req,res,next)=>{
    console.log(req);
    const username = req.username;
    const userId = req.userId;
    const boardId = req.params.boardId;
    const note = req.body.note;
    const details = req.body.details;
    const assignedPerson = req.body.assignedPerson;

    
    if(!details || !assignedPerson){
        return res.send({ message : "details required"})
    }
    // check board exists
    const boardExists = await boardModel.findOne({ _id : boardId});
    if(!boardExists){
        return res.send({ message : "board does not exists"});
    }

    // check ticket exists
    const exists = await ticketModel.findOne({ note : note});
    if(exists){
        return res.send({ message : "ticket already exists"});
    }
    
    // check assignedPerson exists
    const personExists = await userModel.findOne({ username : assignedPerson});
    if(!personExists){
        return res.send({"message " : "assigned person not exists"});
    }
    
    const ticket = await ticketModel.create({ 
        note : note,
        details : details,
        assignedPerson : personExists._id,
        boardId : boardId,
        createdBy : userId,
        status : "pending",
    })
    
    // const ticketObj = {
    //     details : details,
    //     tickedId : ticketId++,
    //     assigned : assignedperson,
    //     admin : username,
    //     boardId : boardId,
    //     status : "pending"

    // }
    // update in org
    // TICKETS.push(ticketObj)
    // const board = BOARDS.find(obj => obj.boardId === boardId);
    // const tickets = board.tickets;
    // tickets.push(ticketId);

    // update in dashboard
    const updateInBoard = await boardModel.updateOne({
        _id : boardId} ,{ $push :{ tickets : ticket._id} 
    });
    res.send({ created : ticket, updatedBoard : updateInBoard});
})

app.get("/get-dashboards/:orgId",authmiddleware,async (req,res,next)=>{
    const username = req.useranme;
    const userId = req.userId;
    const orgId = req.params.orgId;
    // check for orgId exists
    // const org = ORGANISATIONS.find(obj => obj.orgId === orgId);
    // console.log("orgid : ",orgId);
    const orgexists = await orgModel.findOne({ _id : orgId});
    // console.log(orgexists);
    if(!orgexists){
        return res.send({ message : "invalid orgid or org doesn't exists"});
    }

    // check for board exists
    // const boards = BOARDS.filter(obj => obj.orgId === orgId);
    console.log("orgId : ",orgId);
    const boardexists = await boardModel.find({ orgId : orgId });
    if(!boardexists){
        return res.send({ message : "board not exists"});
    }
    res.send({boardexists});
})

app.delete("/delete-dashboard/:boardId",authmiddleware,(req,res,next)=>{
    const username = req.username;
    const boardId = parseInt(req.params.orgId);
    const find = BOARDS.findIndex(obj => obj.boardId === boardId);
    console.log("findboard",find);
    if(!find){
        return res.send({ message : "dashboard doesnot exists"});
    }

    const deleteboard = BOARDS.splice(find,1);
    res.send({ message : deleteboard });
})

// get members of organisations
// delete members of a organisation
// dashboard organisations contains boards (bords, members) tabs
// each board has tickets (pending, inprogress,done) 3 tabs 

app.listen(3000, () => console.log("server listening at port : 3000"));
