const mongoose = require("mongoose");
require("dotenv").config();

const mongoduri = process.env.MONGODB_URI
mongoose.connect(mongoduri)
.then(() => console.log("connection successful"))
.catch((err)=> { console.log("error : " , err)});


const userSchema = new mongoose.Schema({ username : String, password : String});
const orgSchema  = new mongoose.Schema({
    orgname : String, 
    description : String,
    admin : mongoose.Types.ObjectId,
    members : [mongoose.Types.ObjectId] 
})
const boardSchema = new mongoose.Schema({ 
    title : String,
    description : String,
    orgId : mongoose.Types.ObjectId,
    createdBy : mongoose.Types.ObjectId,
    tickets : [mongoose.Types.ObjectId]

})

const ticketSchema = new mongoose.Schema({
    note : String,
    details : String,
    assignedPerson : mongoose.Types.ObjectId,
    boardId : mongoose.Types.ObjectId,
    createdBy : mongoose.Types.ObjectId,
    status : String,
})

const userModel = mongoose.model("USERS",userSchema);
const orgModel = mongoose.model("ORGANISATIONS",orgSchema);
const boardModel = mongoose.model("Boards",boardSchema);
const ticketModel = mongoose.model("tickets",ticketSchema);

module.exports = { userModel : userModel, orgModel : orgModel, boardModel : boardModel, ticketModel : ticketModel};