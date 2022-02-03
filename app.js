const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')

let app = express()
app.use(express.json())
app.use(cors())

const mongoClient = require('mongodb').MongoClient

let db
mongoClient.connect('mongodb+srv://sa3063:1234@cluster0.mmu69.mongodb.net/lessons_store?retryWrites=true&w=majority', function(err,client){
    db = client.db('lessons_store')
})

app.param('collectionName', function(req,res,next,collectionName){
    req.collection = db.collection(collectionName)
    return next()
})

//root
app.get('/',function(req,res){
    res.send("/collection/lessons to view all lessons")
})

//logger
app.use(function(req,res,next){
    console.log("Request ID: "+req.url)
    console.log("Request Date: "+ new Date())
    next()
})

//serve static image files
app.get('/images/:image',function(req,res,next){
    let imageName = req.params.image+".jpeg"
    var filePath = path.join(__dirname,"images",imageName)
    fs.stat(filePath,function(err,fileInfo){
        if(err){
            next()
            return
        }
        else if(fileInfo.isFile()) res.sendFile(filePath)
    })
})

//gets all lessons
app.get('/collection/:collectionName',function(req,res,next){
    req.collection.find({}).toArray(function(err,results,next){
        if (err){
            return next(err)
        }
        else{
            res.send(results)
        }
    })
})

//gets searched lessons
app.get('/search/:searchValue/:collectionName',function(req,res,next){
    let searchValue = req.params.searchValue
    req.collection.find({}).toArray(function(err,results,next){
        if (err){
            return next(err)
        }
        else{
            for (let i = 0; i < results.length; i++) {
                let Subject = results[i].Subject.toLowerCase();
                let Location = results[i].Location.toLowerCase();
                if (!(Subject.includes(searchValue.toLowerCase()) || Location.toLowerCase().includes(searchValue.toLowerCase()))) {
                    results[i].Visible = false;
                }
                else{
                    results[i].Visible = true;
                }
            }
            res.send(results)
        }
    })
})

//saves new order to the collection
app.post('/collection/:collectionName',function(req,res,next){
    req.collection.insertOne(req.body,function(err,result){
        if (err){
            return next(err)
        }
        else{
            res.send("success")
        }
    })
})

let searchValue
// app.post('/search',function(req,res){
//     searchValue = JSON.stringify(req.body.value)
//     // change
//     req.collection = db.collection('lessons')
//     req.collection.find({}).toArray(function(err,results,next){
//         if (err){
//             return next(err)
//         }
//         else{
//             for (let i = 0; i < results.length; i++) {
//                 let Subject = results[i].Subject.toLowerCase();
//                 let Location = results[i].Location.toLowerCase();
//                 if (!(Subject.includes(this.searchValue.toLowerCase()) || Location.toLowerCase().includes(this.searchValue.toLowerCase()))) {
//                     req.collection.updateOne(
//                         {lessonID: results[i].lessonID},
//                         {$set: JSON.stringify({'Visible':false})},
//                         {safe: true, multi:false}
//                     )
//                 }
//                 else{
//                     req.collection.updateOne(
//                         {lessonID: results[i].lessonID},
//                         {$set: JSON.stringify({'Visible':true})},
//                         {safe: true, multi:false}
//                     )
//                 }
//             }
//         }
//     })

// })

const objectID = require('mongodb').ObjectId

//updates number of spaces after order is submitted
app.put('/collection/:collectionName/:lessonID',function(req,res,next){
    req.collection.updateOne(
        {lessonID: req.params.lessonID},
        {$set: req.body},
        {safe: true, multi:false},
        function(err,result){
            if (err){
                return next(err)
            }
            else{
                if(result.acknowledged){
                    res.send("success")
                }
                else{
                    res.send("error")
                }
            }
        }
    )
})
app.delete('/collection/:collectionName/:id',function(req,res,next){
    req.collection.deleteOne(
        {_id: new objectID(req.params.id)},
        {$set: req.body},
        {safe: true, multi:false},
        function(err,result){
            if (err){
                return next(err)
            }
            else{
                res.send(result)
            }
        }
    )
})

//Error handling
app.use(function(req,res){
    console.log("Request ID: "+req.url)
    console.log("Request Date: "+ new Date())
    res.send("error")
})
const port = process.env.PORT || 3000
app.listen(port)