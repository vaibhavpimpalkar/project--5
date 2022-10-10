const express = require('express');
var bodyParser = require('body-parser');

const route = require('./route/route.js');
const {default: mongoose}  = require('mongoose');

const app = express();

app.use(bodyParser.json());

mongoose.connect("mongodb+srv://DipaliBohara:80761668@cluster0.4wyyohq.mongodb.net/dipaliProject5"
, {
   useNewUrlParser: true 
}
).then( () => {console.log("MongoDb is connected")})
.catch( err => console.log(err))

app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});