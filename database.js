// Step 1  MAke sure your postgres database is on

// Install pg npm i pg

//Connection code

// db.js
const { Pool } = require('pg');  // Use Pool for connection pooling

// Create a new Pool instance using the connection string
const pool = new Pool({
    connectionString: 'postgresql://postgres:90210me@localhost:5432/julia',
});

// Export the pool object for use in other files
module.exports = pool;


/*

// Correct the connection string protocol
const connectionString = 'postgresql://postgres:90210me@localhost:5432/julia';

// Creating Client
const client = new Client({
    connectionString: connectionString
});

//const qr = "INSERT INTO public.\"reg\" VALUES('logan', 'blahblahblh', 'password')";

// Connect to the database and execute the query
client.connect(err => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log('Connected');
        client.query(qr, (err, res) => {
            if (err) {
                console.error('Query error', err.stack);
            } else {
                console.log('Query result', res);
            }
            client.end();
        });
    }
});
*/


//const {Pool,Client}= require('pg')



//const connectionString='julia://postgres:90210me@localhost:5432/julia'


//Creating Client
//const client= new Client({
    //connectionString:connectionString
////})

//const pg = require('pg')
//const pool = new pg.Pool();







//const qr="Insert into public.'Reg' Values('seth','me3ail','67192')";
//client.connect()
//client.query(qr,(err,res)=> {
  //console.log(err,res)
  //client.end()
//})

//client.connect()
//client.query('Select * from public.Users',(err,res)=> {
    //console.log(err,res)
   
 //})

////////////////////////////////////////// PSQL Query//////////////////////////////



//Select query

//const qr="Insert into public.Users Values(22, 'yess')";
//client.connect()
//client.query(qr,(err,res)=> {
  //  console.log(err,res)
    //client.end()
//})