require('dotenv').config();

const express = require('express')
const pg = require("pg");



const app = express()
const PORT = process.env.PORT || 5000;


app.use(express.json());

const client = new pg.Client({
    user: process.env.user,
    host: process.env.host,
    database: process.env.database,
    password: process.env.password,
    port: process.env.pgPort
  })


  client.connect();

app.get('/', (req, res) => {
    res.send('Welcome to FastFood Nutrition API')
});

// retrieves the percentage (in decimal form) of protein per meal (calorie proportion), for examaple the recommended ratio 30% for meal
// creates an array of food meeting the desired protein meal %, with +-3%
// recommended for clients percentage not be over 35% since most meals do not go past that and will retrieve few results
// has a restaurant filter, recommended more than three to bring in results
app.post('/specific/proteinMeal', async (req, res) => {
    const {protein, restaurants: restaurantList } = req.body;

    console.log("protein", protein)
    console.log("restaurants", restaurantList);


    try {
        let restaurantFilter = '';
        let values = [protein];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($2)`;
            values.push(selectedRestaurants);
        }

        console.log("filter", restaurantFilter)
        console.log("values", values)

        const query = {
            text: `SELECT restaurant, menu_item, calories, protein, protein_cal_meal
            FROM (
              SELECT restaurant, menu_item, calories, protein, protein_cal_meal FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_cal_meal FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_cal_meal FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_cal_meal FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_cal_meal FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_cal_meal FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_cal_meal FROM tacobell1_menu
            ) AS all_menus
                WHERE protein_cal_meal BETWEEN $1 - 0.03 AND $1 + 0.03
                ${restaurantFilter}            `,
            values: values
        };
        

        const result = await client.query(query);

        
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, protein, protein_cal_meal } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                proteinGrams: protein,
                proteinMealPercentage: protein_cal_meal * 100
            });
        });

        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// retrieves meals that fit within desired daily protein percentage 
// to see how much a meal will contribute to your daily percentage of protein intake
// typically around 10% as the maxmimum, has a +-0.05 range
// based on the average 2000 calories a day
app.post('/average/proteinDay', async (req, res) => {
    const {protein, restaurants: restaurantList} = req.body;

    console.log("protein", protein)

    try {
        let restaurantFilter = '';
        let values = [protein];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($2)`;
            values.push(selectedRestaurants);
        }

        const query = {
            text: `SELECT restaurant, menu_item, calories, protein, protein_day
            FROM (
              SELECT restaurant, menu_item, calories, protein, protein_day FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_day FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_day FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_day FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_day FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_day FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein, protein_day FROM tacobell1_menu
            ) AS all_menus
                WHERE protein_day BETWEEN $1 - 0.005 AND $1 + 0.005 
                ${restaurantFilter}          `,
            values: values
        };
        

        const result = await client.query(query);

       
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, protein, protein_day } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                proteinGrams: protein,
                proteinDayPercentage: parseFloat((protein_day * 100).toFixed(2))
            });
        });

        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// retrieves meals that fit within desired daily protein percentage 
// to see how much a meal will contribute to your daily percentage of protein intake
// notice that this is just looking at protein calories, not calories of the meal, for example it is recommended that 10-30% of your calories are protein cals
// typically around 10% as the maxmimum, has a +-0.05 range
// based on the users entered calories a day
app.post('/customized/proteinDay', async (req, res) => {
    const {proteinPercent, caloriesDay, restaurants: restaurantList} = req.body;

    console.log("proteinPercent", proteinPercent)
    console.log("caloriesDay", caloriesDay)

    try {
        let restaurantFilter = '';
        let values = [];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($3)`;
            values.push(selectedRestaurants);
        }


        const proteinCalories = proteinPercent * caloriesDay;
        const minProtein = Math.floor(proteinCalories / 4 - (0.01 * caloriesDay / 4));
        const maxProtein = Math.ceil(proteinCalories / 4 + (0.01 * caloriesDay / 4));

        const query = {
            text: `SELECT restaurant, menu_item, calories, protein
            FROM (
              SELECT restaurant, menu_item, calories, protein FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
            ) AS all_menus
                 WHERE protein BETWEEN $1 AND $2
                 ${restaurantFilter}       `,
            values: [minProtein, maxProtein, ...values]
        };
        

        const result = await client.query(query);

       
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, protein } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                proteinGrams: protein,
                proteinDailyPercentage: parseFloat(((protein * 4 / caloriesDay) * 100).toFixed(2))
            });
        });


        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// retrieve meals that fit a +- 0.02 of the desired carb to calorie ratio per meal
// typically a higher percentage +30% 
app.post('/specific/carbMeal', async (req, res) => {
    const {carb, restaurants: restaurantList} = req.body;

    console.log("carb", carb)

    try {
        let restaurantFilter = '';
        let values = [carb];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($2)`;
            values.push(selectedRestaurants);
        }

        const query = {
            text: `SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal
            FROM (
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal FROM tacobell1_menu
            ) AS all_menus
                WHERE carb_cal_meal BETWEEN $1 - 0.02 AND $1 + 0.02
                ${restaurantFilter}             `,
            values: values
        };
        

        const result = await client.query(query);

        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, total_carbohydrate, carb_cal_meal } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                totalCarb: total_carbohydrate,
                carbMealPercentage: carb_cal_meal * 100
            });
        });

        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// retrieves meals that fit within desired daily carb percentage 
// to see how much a meal will contribute to your daily percentage of carbohydrates intake
// typically around 15% as the maxmimum, has a +-0.01 range
// based on the average 2000 calorie 
app.post('/average/carbDay', async (req, res) => {
    const {carb, restaurants: restaurantList} = req.body;

    console.log("carb", carb)

    try {
        let restaurantFilter = '';
        let values = [carb];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($2)`;
            values.push(selectedRestaurants);
        }


        const query = {
            text: `SELECT restaurant, menu_item, calories, carb_day
            FROM (
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_day FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_day FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_day FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_day FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_day FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_day FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate, carb_day FROM tacobell1_menu
            ) AS all_menus
                WHERE carb_day BETWEEN $1 - 0.01 AND $1 + 0.01 
                ${restaurantFilter}           `,
            values: values
        };
        

        const result = await client.query(query);

       
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, total_carbohydrate, carb_day } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories, 
                totalCarb: total_carbohydrate,
                carbDayPercentage: carb_day * 100
            });
        });

        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})





// retrieves meals that fit within desired daily carb percentage 
// to see how much a meal will contribute to your daily percentage of carbohydrates intake

// typically around 15% as the maxmimum, has a +-0.01 range
// custimized based on the user's entered calories for the day
app.post('/customized/carbDay', async (req, res) => {
    const {carbPercent, caloriesDay, restaurants: restaurantList} = req.body;

    console.log("carbPercent", carbPercent)
    console.log("caloriesDay", caloriesDay)

    try {
        let restaurantFilter = '';
        let values = [];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($3)`;
            values.push(selectedRestaurants);
        }

        const carbCalories = carbPercent * caloriesDay;
        const minCarb = Math.floor(carbCalories / 4 - (0.01 * caloriesDay / 4));
        const maxCarb = Math.ceil(carbCalories / 4 + (0.01 * caloriesDay / 4));

        const query = {
            text: `SELECT restaurant, menu_item, calories, total_carbohydrate
            FROM (
              SELECT restaurant, menu_item, calories, total_carbohydrate FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, total_carbohydrate FROM tacobell1_menu
            ) AS all_menus
                 WHERE total_carbohydrate BETWEEN $1 AND $2
                 ${restaurantFilter}       `,
            values: [minCarb, maxCarb, ...values]
        };
        

        const result = await client.query(query);

       
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, total_carbohydrate } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                carbGrams: total_carbohydrate,
                carbDailyPercentage: parseFloat(((total_carbohydrate * 4 / caloriesDay) * 100).toFixed(2))
            });
        });

        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// retrieves protein within +-2 of the desired protein levels
// returns the menu item, restuarant, calories, and protein of each item
app.post('/specific/proteinlvl', async (req, res) => {
    const { proteinlvl, restaurants: restaurantList } = req.body; // 'restaurants' should be an array

    console.log("protein", proteinlvl);
    console.log("restaurants", restaurantList);

    try {
        let restaurantFilter = '';
        let values = [proteinlvl];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($2)`;
            values.push(selectedRestaurants);
        }

        console.log("filter", restaurantFilter)
        console.log("values", values)

        const query = {
            text: `SELECT restaurant, menu_item, calories, protein
             FROM (
                    SELECT restaurant, menu_item, calories, protein FROM arbys_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM subway_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
                  ) AS all_menus
                WHERE protein BETWEEN $1 - 2 AND $1 + 2
                ${restaurantFilter}`, // Added the dynamic restaurant filter
            values: values // Pass the selected restaurants as values
        };

        const result = await client.query(query);

        const restaurantsData = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, protein } = row;
            if (!restaurantsData[restaurant]) {
                restaurantsData[restaurant] = [];
            }
            restaurantsData[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                protein: protein
            });
        });

        res.json({ restaurants: restaurantsData });

    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// retrieves foods within the desired range for calories
// can add an extra protein filter that retrieves food within the calorie range and minimum protein level
// can add a total fat filter that retrives food under the max total fat within the calorie range
app.post('/calorieRange', async (req, res) => {
    const {lowerRange, upperRange, proteinlvl, restaurants: restaurantList} = req.body;

    console.log("lowerRange", lowerRange)
    console.log("upperRange", upperRange)
    console.log("proteinlvl", proteinlvl)

    try {
        let restaurantFilter = '';
        let values = [lowerRange, upperRange];
        if (restaurantList) {
            const selectedRestaurants = Array.isArray(restaurantList) ? restaurantList : [restaurantList];
            restaurantFilter = `AND restaurant = ANY($3)`;
            values.push(selectedRestaurants);
        }

        if (proteinlvl === undefined) {
        const query = {
            text: `SELECT restaurant, menu_item, calories, protein
             FROM (
                    SELECT restaurant, menu_item, calories, protein FROM arbys_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM subway_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
                  ) AS all_menus
                WHERE calories BETWEEN $1 AND $2 
                    ${restaurantFilter}                  `,
            values: values
        };
        const result = await client.query(query);

        
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, protein } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                protein: protein
            });
        });

        res.json({ restaurants });

    
    } else {
        const query = {
            text: `SELECT restaurant, menu_item, calories, protein
             FROM (
                    SELECT restaurant, menu_item, calories, protein FROM arbys_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM subway_menu
                    UNION ALL
                    SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
                  ) AS all_menus
                WHERE calories BETWEEN $1 AND $2 
                    ${restaurantFilter} 
                    AND protein >= $4
                  
                 `,
            values: [...values, proteinlvl]
        };
        const result = await client.query(query);

        
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, protein } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
                protein: protein
            });
        });

        res.json({ restaurants });
    }

        

        
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})









app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))

