const express = require('express');
const app = express();
const port = 8001;
const bodyParser = require('body-parser');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');  // Import express-session
const pool = require('./database'); // Import the pool from db.js
const path = require('path'); // Add this for correct path handling


// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Connection string for Postgres
const connectionString = 'postgresql://postgres:90210me@localhost:5432/julia';

const client = new Client({
    connectionString: connectionString
});

// Connect to the database when the app starts
client.connect(err => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log('Connected to the database');
    }
});

///////////////////////// Registration Route ///////////////////////////


app.post("/submit", async (req, res) => {
    const { name, email, password } = req.body;


  //  if (!name || !email || !password) {
  //      return res.status(400).json({ error: "Please fill out all fields." });
   // }

    //if (!password || password.length < 8)  {
        // Send the form back with an error message at the top of the page
     //   return res.status(400).json({ error: "Password must be at least 8 characters long."});
   // }

            
          
    

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Insert data into the database
        const result = await client.query(
            'INSERT INTO public.reg(name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );

        console.log('Data inserted:', result);
        res.send(`
            <html>
            <style>
            /* @import url("form/style.css"); */
            h1 {
                font-family: 'Futura';
                text-align: center;
                color: rgb(79, 134, 56);
            }
            p {
                font-family: 'Futura';
                text-align: center;
            }
            
            .bottom-button-container {
            position: absolute;
            bottom: 80px; /* Position it slightly above the bottom of the page */
            left: 0;
            width: 100%;
            text-align: center; /* Center the button */
             }

            .bottom-button-container a {
                display: inline-block;
                font-size: 18px;
                font-family: 'Futura';
                border-radius: 8px;
                text-align: center;
                background-color: #3498db; /* Blue color for the button */
                color: #FFFFFF;
                padding: 15px 30px;
                text-decoration: none; /* Remove underline */
                transition: background-color 0.3s ease;
            }

            .bottom-button-container a:hover {
                background-color: #2980b9; /* Darker blue on hover */
            }

            </style>

                <body>
                    <h1>Account Created Successfully!</h1>
                    <p>Thank you, ${name}! Your account has been successfully created.</p>
                    <div class="bottom-button-container">
                        <a href="/signin">Sign into your account:</a>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        console.error('Detailed query error:', err); // Log the full error object
        res.status(500).send(`
            <html>
                <body>
                    <h1>Error Saving Data to the Database</h1>
                    <p>${err.message}</p> <!-- Display error message on the webpage -->
                    <a href="/">Try again</a>
                </body>
            </html>
        `);
    }
});


//  route for sign-in
app.get('/signin', (req, res) => {
    res.sendFile(__dirname + '/signin.html');
});



///////////////////////// Sign-In Route ///////////////////////////

app.post("/login", async (req, res) => { // 
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const result = await client.query('SELECT * FROM public.reg WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            // User not found
            return res.status(400).send('Invalid email or password.');
        }

        const user = result.rows[0];

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Password doesn't match
            return res.status(400).send('Invalid email or password.');
        }
        req.session.user = {
            id: user.id, // 
            name: user.name,
            email: user.email
        };
        console.log('Session after login:', req.session);
         // Successful login - store user info in session
         /* if (user) {
            req.session.user = {
                id: user.id,  // or user._id depending on your database
                name: user.name,
                email: user.email
                 //  this field exists
            };} */

        // Successful login
        res.send(`
            <html>
            <style>
            /* @import url("form/style.css"); */
            h1 {
                font-family: 'Futura';
                text-align: center;
                color: rgb(79, 134, 56);
            }
            
            .bottom-button-container {
            position: absolute;
            bottom: 150px; /* Position it slightly above the bottom of the page */
            left: 0;
            width: 100%;
            text-align: center; /* Center the button */
             }

            .bottom-button-container a {
                display: inline-block;
                font-size: 18px;
                font-family: 'Futura';
                border-radius: 8px;
                text-align: center;
                background-color: #3498db; /* Blue color for the button */
                color: #FFFFFF;
                padding: 15px 30px;
                text-decoration: none; /* Remove underline */
                transition: background-color 0.3s ease;
            }

            .bottom-button-container a:hover {
                background-color: #2980b9; /* Darker blue on hover */
            }

            </style>

                <body>
                    <h1>Account accessed successfully!</h1>
                    <div class="bottom-button-container">
                        <a href="/home">Go to homepage:</a>
                    </div>
                </body>
            </html>
        `); // You can redirect the user to another page here


    } catch (err) {
        console.error('Query error', err.stack);
        res.status(500).send('Server error');
    }
});

app.get('/home', (req, res) => {
    res.render('home', { user: req.session.user });
});



///// plants //////

app.get('/plants', async (req, res) => {
    const searchQuery = req.query.search || '';
    const category = req.query.category || '';
    const sunlight = req.query.sunlight || '';
    const water_needs = req.query.water_needs || '';

    let queryText = 'SELECT * FROM plants WHERE 1=1';
    let queryParams = [];
    let filterCount = 0;

    // Search filter
    if (searchQuery.trim()) {
        queryParams.push(`%${searchQuery}%`);
        queryText += ` AND name ILIKE $${++filterCount}`;
    }

    // Category filter
    if (category.trim()) {
        queryParams.push(category);
        queryText += ` AND category = $${++filterCount}`;
    }

    // Sunlight filter
    if (sunlight.trim()) {
        queryParams.push(sunlight);
        queryText += ` AND sunlight = $${++filterCount}`;
    }

    // Water needs filter
    if (water_needs.trim()) {
        queryParams.push(water_needs);
        queryText += ` AND water_needs = $${++filterCount}`;
    }

    console.log('Query Text:', queryText);
    console.log('Query Params:', queryParams);

    try {
        const result = await pool.query(queryText, queryParams);
        res.render('plant-list', { plants: result.rows });
    } catch (err) {
        console.error('Error fetching plants:', err.message);
        res.status(500).send('Server error');
    }
});






app.get('/plants/:id', async (req, res) => {
    const plantId = req.params.id;
    const userId = req.session.user ? req.session.user.id : null;

    const plantQuery = 'SELECT * FROM plants WHERE id = $1';
    const saveQuery = 'SELECT 1 FROM user_plants WHERE user_id = $1 AND plant_id = $2';
    const commentsQuery = `
        SELECT c.comment, c.commented_at, r.name AS author_name
        FROM comments c
        JOIN reg r ON c.user_id = r.id
        WHERE c.plant_id = $1
        ORDER BY c.commented_at DESC
    `;
    const growthLogsQuery = `
        SELECT * FROM growth_logs WHERE plant_id = $1 ORDER BY logged_at DESC
    `;

    try {
        const plantResult = await pool.query(plantQuery, [plantId]);

        if (plantResult.rows.length === 0) {
            return res.status(404).send('Plant not found');
        }

        let isSaved = false;
        if (userId) {
            const saveResult = await pool.query(saveQuery, [userId, plantId]);
            isSaved = saveResult.rows.length > 0;
        }

        const commentsResult = await pool.query(commentsQuery, [plantId]);
        const growthLogsResult = await pool.query(growthLogsQuery, [plantId]);

        res.render('plant-detail', {
            plant: plantResult.rows[0],
            isSaved: isSaved,
            comments: commentsResult.rows || [],
            growthLogs: growthLogsResult.rows || [],  // Pass growth logs to the template
            user: req.session.user
        });

    } catch (err) {
        console.error('Error handling plant detail request:', err.stack);
        res.status(500).send('Server error');
    }
});








app.post('/plants/:id/save', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/signin.html');
    }

    const userId = req.session.user.id;
    const plantId = req.params.id;

    const query = 'INSERT INTO user_plants (user_id, plant_id) VALUES ($1, $2)';

    try {
        await pool.query(query, [userId, plantId]);
        res.redirect(`/plants/${plantId}`);
    } catch (err) {
        console.error('Error saving plant to profile:', err);
        res.status(500).send('Error saving plant to profile');
    }
});

app.post('/plants/:id/comments', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/signin'); // Redirect to login if not authenticated
    }

    const userId = req.session.user.id;
    const plantId = req.params.id;
    const comment = req.body.comment;

    const insertCommentQuery = 'INSERT INTO comments (plant_id, user_id, comment) VALUES ($1, $2, $3)';

    try {
        await pool.query(insertCommentQuery, [plantId, userId, comment]);
        res.redirect(`/plants/${plantId}`); // Redirect back to the plant detail page
    } catch (err) {
        console.error('Error adding comment:', err.stack);
        res.status(500).send('Server error');
    }
});

app.post('/plants/:id/log-growth', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/signin'); // Redirect to login if not authenticated
    }

    const userId = req.session.user.id;
    const plantId = req.params.id;
    const { height, condition, notes } = req.body;

    const insertGrowthLogQuery = `
        INSERT INTO growth_logs (user_id, plant_id, height, condition, notes) 
        VALUES ($1, $2, $3, $4, $5)
    `;

    try {
        await pool.query(insertGrowthLogQuery, [userId, plantId, height, condition, notes]);
        res.redirect(`/plants/${plantId}`); // Redirect back to the plant detail page
    } catch (err) {
        console.error('Error adding growth log:', err.stack);
        res.status(500).send('Server error');
    }
});


app.get('/profile', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/signin.html'); // Redirect to login if not authenticated
    }

    const userId = req.session.user.id;

    try {
        const savedPlantsQuery = `
            SELECT p.name, p.scientific_name, p.description, up.saved_at
            FROM user_plants up
            JOIN plants p ON up.plant_id = p.id
            WHERE up.user_id = $1
            ORDER BY up.saved_at DESC
        `;
        const growthLogsQuery = `
            SELECT gl.height, gl.condition, gl.notes, gl.logged_at, p.name AS plant_name
            FROM growth_logs gl
            JOIN plants p ON gl.plant_id = p.id
            WHERE gl.user_id = $1
            ORDER BY gl.logged_at DESC
        `;
        const result = await pool.query(savedPlantsQuery, [userId]);
        const growthLogsResult = await pool.query(growthLogsQuery, [userId]);

        if (result.rows.length > 0) {
            const savedPlants = result.rows;

            res.render('profile', {
                name: req.session.user.name,
                email: req.session.user.email,
                savedPlants: savedPlants,
                growthLogs: growthLogsResult.rows,
            });
        } else {
            res.render('profile', {
                name: req.session.user.name,
                email: req.session.user.email,
                savedPlants: [],
            });
        }
    } catch (err) {
        console.error('Error fetching saved plants:', err);
        res.status(500).send('Server error');
    }
});




app.listen(port, () => {
    console.log(`App listening on port ${port}!`);
});


