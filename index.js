
const express = require('express')
const pg = require("pg");


const app = express()
const PORT = process.env.PORT || 5000;


app.use(express.json());

const client = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "FastFoodNutrition",
    password: "Believe112",
    port: "5555"
  })


  client.connect();

app.get('/', (req, res) => {
    res.send('Welcome to FastFood Nutrition API')
});

// retrieves the percentage of protein per meal (calorie proportion), for examaple the recommended ratio 30% for meal
// creates an array of food meeting the desired protein meal %, with +-3%
// recommended for clients percentage not be over 35% since most meals do not go past that and will retrieve few results
app.get('/specific/proteinMeal', async (req, res) => {
    const {protein} = req.query;

    console.log("protein", protein)

    try {
        const query = {
            text: `SELECT restaurant, menu_item, protein_cal_meal
            FROM (
              SELECT restaurant, menu_item, protein_cal_meal FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, protein_cal_meal FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, protein_cal_meal FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, protein_cal_meal FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, protein_cal_meal FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, protein_cal_meal FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, protein_cal_meal FROM tacobell1_menu
            ) AS all_menus
                WHERE protein_cal_meal BETWEEN $1 - 0.03 AND $1 + 0.03            `,
            values: [protein]
        };
        

        const result = await client.query(query);

        
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, protein_cal_meal } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
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
app.get('/average/proteinDay', async (req, res) => {
    const {protein} = req.query;

    console.log("protein", protein)

    try {
        const query = {
            text: `SELECT restaurant, menu_item, calories, protein_day
            FROM (
              SELECT restaurant, menu_item, calories, protein_day FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein_day FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein_day FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein_day FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein_day FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein_day FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, calories, protein_day FROM tacobell1_menu
            ) AS all_menus
                WHERE protein_day BETWEEN $1 - 0.005 AND $1 + 0.005           `,
            values: [protein]
        };
        

        const result = await client.query(query);

       
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, calories, protein_day } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
                calories: calories,
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
app.get('/customized/proteinDay', async (req, res) => {
    const {proteinPercent, caloriesDay} = req.query;

    console.log("proteinPercent", proteinPercent)
    console.log("caloriesDay", caloriesDay)

    try {

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
                 WHERE protein BETWEEN $1 AND $2       `,
            values: [minProtein, maxProtein]
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


        // protein: ((protein*4)/caloriesDay)*100

        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// retrieve meals that fit a +- 0.02 of the desired carb to calorie ratio per meal
// typically a higher percentage +30% 
app.get('/specific/carbMeal', async (req, res) => {
    const {carb} = req.query;

    console.log("carb", carb)

    try {
        const query = {
            text: `SELECT restaurant, menu_item, carb_cal_meal
            FROM (
              SELECT restaurant, menu_item, carb_cal_meal FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_cal_meal FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_cal_meal FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_cal_meal FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_cal_meal FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_cal_meal FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_cal_meal FROM tacobell1_menu
            ) AS all_menus
                WHERE carb_cal_meal BETWEEN $1 - 0.02 AND $1 + 0.02            `,
            values: [carb]
        };
        

        const result = await client.query(query);

        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, carb_cal_meal } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
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
app.get('/average/carbDay', async (req, res) => {
    const {carb} = req.query;

    console.log("carb", carb)

    try {
        const query = {
            text: `SELECT restaurant, menu_item, carb_day
            FROM (
              SELECT restaurant, menu_item, carb_day FROM arbys_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_day FROM burgerking_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_day FROM carlsjr_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_day FROM chickfila_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_day FROM jackinthebox_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_day FROM subway_menu
              UNION ALL
              SELECT restaurant, menu_item, carb_day FROM tacobell1_menu
            ) AS all_menus
                WHERE carb_day BETWEEN $1 - 0.01 AND $1 + 0.01           `,
            values: [carb]
        };
        

        const result = await client.query(query);

       
        const restaurants = {};
        result.rows.forEach(row => {
            const { restaurant, menu_item, carb_day } = row;
            if (!restaurants[restaurant]) {
                restaurants[restaurant] = [];
            }
            restaurants[restaurant].push({
                menuItem: menu_item,
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
app.get('/customized/carbDay', async (req, res) => {
    const {carbPercent, caloriesDay} = req.query;

    console.log("carbPercent", carbPercent)
    console.log("caloriesDay", caloriesDay)

    try {

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
                 WHERE total_carbohydrate BETWEEN $1 AND $2       `,
            values: [minCarb, maxCarb]
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


        // protein: ((protein*4)/caloriesDay)*100

        res.json({ restaurants });
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})



// retrieves protein within +-2 of the desired protein levels
// returns the menu item, restuarant, calories, and protein of each item
app.get('/specific/protein', async (req, res) => {
    const {proteinlvl} = req.query;

    console.log("protein", proteinlvl)

    try {
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
                 `,
            values: [proteinlvl]
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
    
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})


// TRIAL
app.post('/specific/proteinlvl', async (req, res) => {
    const { proteinlvl, restaurants } = req.body; // 'restaurants' should be an array

    console.log("protein", proteinlvl);
    console.log("restaurants", restaurants);

    try {
        // Construct the WHERE clause based on the specified restaurants
        let restaurantFilter = '';
        let values = [proteinlvl];
        if (restaurants) {
            const selectedRestaurants = Array.isArray(restaurants) ? restaurants : [restaurants];
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
app.get('/calorieRange', async (req, res) => {
    const {lowerRange, upperRange, proteinlvl} = req.query;

    console.log("lowerRange", lowerRange)
    console.log("upperRange", upperRange)
    console.log("proteinlvl", proteinlvl)

    try {
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
                 `,
            values: [lowerRange, upperRange]
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
                  AND protein >= $3

                 `,
            values: [lowerRange, upperRange, proteinlvl]
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

// const PORT = 8000

// const express = require('express')
// const axios = require('axios')
// const pg = require("pg");


// const app = express()

// app.use(express.json());

// const client = new pg.Client({
//     user: "postgres",
//     host: "localhost",
//     database: "FastFoodNutrition",
//     password: "Believe112",
//     port: "5555"
//   })


//   client.connect();

// // retrieves the percentage of protein per meal (calorie proportion), for examaple the recommended ratio 30% for meal
// // creates an array of food meeting the desired protein meal %, with +-3%
// // recommended for clients percentage not be over 35% since most meals do not go past that and will retrieve few results
// app.get('/specific/proteinMeal', async (req, res) => {
//     const {protein} = req.query;

//     console.log("protein", protein)

//     try {
//         const query = {
//             text: `SELECT restaurant, menu_item, protein_cal_meal
//             FROM (
//               SELECT restaurant, menu_item, protein_cal_meal FROM arbys_menu
//               UNION ALL
//               SELECT restaurant, menu_item, protein_cal_meal FROM burgerking_menu
//               UNION ALL
//               SELECT restaurant, menu_item, protein_cal_meal FROM carlsjr_menu
//               UNION ALL
//               SELECT restaurant, menu_item, protein_cal_meal FROM chickfila_menu
//               UNION ALL
//               SELECT restaurant, menu_item, protein_cal_meal FROM jackinthebox_menu
//               UNION ALL
//               SELECT restaurant, menu_item, protein_cal_meal FROM subway_menu
//               UNION ALL
//               SELECT restaurant, menu_item, protein_cal_meal FROM tacobell1_menu
//             ) AS all_menus
//                 WHERE protein_cal_meal BETWEEN $1 - 0.03 AND $1 + 0.03            `,
//             values: [protein]
//         };
        

//         const result = await client.query(query);

        
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, protein_cal_meal } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 proteinMealPercentage: protein_cal_meal * 100
//             });
//         });

//         res.json({ restaurants });
    
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })



// // retrieves meals that fit within desired daily protein percentage 
// // to see how much a meal will contribute to your daily percentage of protein intake
// // typically around 10% as the maxmimum, has a +-0.05 range
// // based on the average 2000 calories a day
// app.get('/average/proteinDay', async (req, res) => {
//     const {protein} = req.query;

//     console.log("protein", protein)

//     try {
//         const query = {
//             text: `SELECT restaurant, menu_item, calories, protein_day
//             FROM (
//               SELECT restaurant, menu_item, calories, protein_day FROM arbys_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein_day FROM burgerking_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein_day FROM carlsjr_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein_day FROM chickfila_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein_day FROM jackinthebox_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein_day FROM subway_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein_day FROM tacobell1_menu
//             ) AS all_menus
//                 WHERE protein_day BETWEEN $1 - 0.005 AND $1 + 0.005           `,
//             values: [protein]
//         };
        

//         const result = await client.query(query);

       
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, calories, protein_day } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 calories: calories,
//                 proteinDayPercentage: parseFloat((protein_day * 100).toFixed(2))
//             });
//         });

//         res.json({ restaurants });
    
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })

// // retrieves meals that fit within desired daily protein percentage 
// // to see how much a meal will contribute to your daily percentage of protein intake
// // notice that this is just looking at protein calories, not calories of the meal, for example it is recommended that 10-30% of your calories are protein cals
// // typically around 10% as the maxmimum, has a +-0.05 range
// // based on the users entered calories a day
// app.get('/customized/proteinDay', async (req, res) => {
//     const {proteinPercent, caloriesDay} = req.query;

//     console.log("proteinPercent", proteinPercent)
//     console.log("caloriesDay", caloriesDay)

//     try {

//         const proteinCalories = proteinPercent * caloriesDay;
//         const minProtein = Math.floor(proteinCalories / 4 - (0.01 * caloriesDay / 4));
//         const maxProtein = Math.ceil(proteinCalories / 4 + (0.01 * caloriesDay / 4));

//         const query = {
//             text: `SELECT restaurant, menu_item, calories, protein
//             FROM (
//               SELECT restaurant, menu_item, calories, protein FROM arbys_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein FROM subway_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
//             ) AS all_menus
//                  WHERE protein BETWEEN $1 AND $2       `,
//             values: [minProtein, maxProtein]
//         };
        

//         const result = await client.query(query);

       
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, calories, protein } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 calories: calories,
//                 proteinGrams: protein,
//                 proteinDailyPercentage: parseFloat(((protein * 4 / caloriesDay) * 100).toFixed(2))
//             });
//         });


//         // protein: ((protein*4)/caloriesDay)*100

//         res.json({ restaurants });
    
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })



// // retrieve meals that fit a +- 0.02 of the desired carb to calorie ratio per meal
// // typically a higher percentage +30% 
// app.get('/specific/carbMeal', async (req, res) => {
//     const {carb} = req.query;

//     console.log("carb", carb)

//     try {
//         const query = {
//             text: `SELECT restaurant, menu_item, carb_cal_meal
//             FROM (
//               SELECT restaurant, menu_item, carb_cal_meal FROM arbys_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_cal_meal FROM burgerking_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_cal_meal FROM carlsjr_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_cal_meal FROM chickfila_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_cal_meal FROM jackinthebox_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_cal_meal FROM subway_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_cal_meal FROM tacobell1_menu
//             ) AS all_menus
//                 WHERE carb_cal_meal BETWEEN $1 - 0.02 AND $1 + 0.02            `,
//             values: [carb]
//         };
        

//         const result = await client.query(query);

//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, carb_cal_meal } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 carbMealPercentage: carb_cal_meal * 100
//             });
//         });

//         res.json({ restaurants });
    
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })



// // retrieves meals that fit within desired daily carb percentage 
// // to see how much a meal will contribute to your daily percentage of carbohydrates intake
// // typically around 15% as the maxmimum, has a +-0.01 range
// // based on the average 2000 calorie 
// app.get('/average/carbDay', async (req, res) => {
//     const {carb} = req.query;

//     console.log("carb", carb)

//     try {
//         const query = {
//             text: `SELECT restaurant, menu_item, carb_day
//             FROM (
//               SELECT restaurant, menu_item, carb_day FROM arbys_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_day FROM burgerking_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_day FROM carlsjr_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_day FROM chickfila_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_day FROM jackinthebox_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_day FROM subway_menu
//               UNION ALL
//               SELECT restaurant, menu_item, carb_day FROM tacobell1_menu
//             ) AS all_menus
//                 WHERE carb_day BETWEEN $1 - 0.01 AND $1 + 0.01           `,
//             values: [carb]
//         };
        

//         const result = await client.query(query);

       
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, carb_day } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 carbDayPercentage: carb_day * 100
//             });
//         });

//         res.json({ restaurants });
    
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })





// // retrieves meals that fit within desired daily carb percentage 
// // to see how much a meal will contribute to your daily percentage of carbohydrates intake

// // typically around 15% as the maxmimum, has a +-0.01 range
// // custimized based on the user's entered calories for the day
// app.get('/customized/carbDay', async (req, res) => {
//     const {carbPercent, caloriesDay} = req.query;

//     console.log("carbPercent", carbPercent)
//     console.log("caloriesDay", caloriesDay)

//     try {

//         const carbCalories = carbPercent * caloriesDay;
//         const minCarb = Math.floor(carbCalories / 4 - (0.01 * caloriesDay / 4));
//         const maxCarb = Math.ceil(carbCalories / 4 + (0.01 * caloriesDay / 4));

//         const query = {
//             text: `SELECT restaurant, menu_item, calories, total_carbohydrate
//             FROM (
//               SELECT restaurant, menu_item, calories, total_carbohydrate FROM arbys_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, total_carbohydrate FROM burgerking_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, total_carbohydrate FROM carlsjr_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, total_carbohydrate FROM chickfila_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, total_carbohydrate FROM jackinthebox_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, total_carbohydrate FROM subway_menu
//               UNION ALL
//               SELECT restaurant, menu_item, calories, total_carbohydrate FROM tacobell1_menu
//             ) AS all_menus
//                  WHERE total_carbohydrate BETWEEN $1 AND $2       `,
//             values: [minCarb, maxCarb]
//         };
        

//         const result = await client.query(query);

       
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, calories, total_carbohydrate } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 calories: calories,
//                 carbGrams: total_carbohydrate,
//                 carbDailyPercentage: parseFloat(((total_carbohydrate * 4 / caloriesDay) * 100).toFixed(2))
//             });
//         });


//         // protein: ((protein*4)/caloriesDay)*100

//         res.json({ restaurants });
    
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })



// // retrieves protein within +-2 of the desired protein levels
// // returns the menu item, restuarant, calories, and protein of each item
// app.get('/specific/protein', async (req, res) => {
//     const {proteinlvl} = req.query;

//     console.log("protein", proteinlvl)

//     try {
//         const query = {
//             text: `SELECT restaurant, menu_item, calories, protein
//              FROM (
//                     SELECT restaurant, menu_item, calories, protein FROM arbys_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM subway_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
//                   ) AS all_menus
//                 WHERE protein BETWEEN $1 - 2 AND $1 + 2     
//                  `,
//             values: [proteinlvl]
//         };
        

//         const result = await client.query(query);

        
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, calories, protein } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 calories: calories,
//                 protein: protein
//             });
//         });

//         res.json({ restaurants });
    
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })


// // TRIAL
// app.post('/specific/proteinlvl', async (req, res) => {
//     const { proteinlvl, restaurants } = req.body; // 'restaurants' should be an array

//     console.log("protein", proteinlvl);
//     console.log("restaurants", restaurants);

//     try {
//         // Construct the WHERE clause based on the specified restaurants
//         let restaurantFilter = '';
//         let values = [proteinlvl];
//         if (restaurants) {
//             const selectedRestaurants = Array.isArray(restaurants) ? restaurants : [restaurants];
//             restaurantFilter = `AND restaurant = ANY($2)`;
//             values.push(selectedRestaurants);
//         }

//         console.log("filter", restaurantFilter)
//         console.log("values", values)

//         const query = {
//             text: `SELECT restaurant, menu_item, calories, protein
//              FROM (
//                     SELECT restaurant, menu_item, calories, protein FROM arbys_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM subway_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
//                   ) AS all_menus
//                 WHERE protein BETWEEN $1 - 2 AND $1 + 2
//                 ${restaurantFilter}`, // Added the dynamic restaurant filter
//             values: values // Pass the selected restaurants as values
//         };

//         const result = await client.query(query);

//         const restaurantsData = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, calories, protein } = row;
//             if (!restaurantsData[restaurant]) {
//                 restaurantsData[restaurant] = [];
//             }
//             restaurantsData[restaurant].push({
//                 menuItem: menu_item,
//                 calories: calories,
//                 protein: protein
//             });
//         });

//         res.json({ restaurants: restaurantsData });

//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })



// // retrieves foods within the desired range for calories
// // can add an extra protein filter that retrieves food within the calorie range and minimum protein level
// // can add a total fat filter that retrives food under the max total fat within the calorie range
// app.get('/calorieRange', async (req, res) => {
//     const {lowerRange, upperRange, proteinlvl} = req.query;

//     console.log("lowerRange", lowerRange)
//     console.log("upperRange", upperRange)
//     console.log("proteinlvl", proteinlvl)

//     try {
//         if (proteinlvl === undefined) {
//         const query = {
//             text: `SELECT restaurant, menu_item, calories, protein
//              FROM (
//                     SELECT restaurant, menu_item, calories, protein FROM arbys_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM subway_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
//                   ) AS all_menus
//                 WHERE calories BETWEEN $1 AND $2    
//                  `,
//             values: [lowerRange, upperRange]
//         };
//         const result = await client.query(query);

        
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, calories, protein } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 calories: calories,
//                 protein: protein
//             });
//         });

//         res.json({ restaurants });

    
//     } else {
//         const query = {
//             text: `SELECT restaurant, menu_item, calories, protein
//              FROM (
//                     SELECT restaurant, menu_item, calories, protein FROM arbys_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM burgerking_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM carlsjr_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM chickfila_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM jackinthebox_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM subway_menu
//                     UNION ALL
//                     SELECT restaurant, menu_item, calories, protein FROM tacobell1_menu
//                   ) AS all_menus
//                 WHERE calories BETWEEN $1 AND $2 
//                   AND protein >= $3

//                  `,
//             values: [lowerRange, upperRange, proteinlvl]
//         };
//         const result = await client.query(query);

        
//         const restaurants = {};
//         result.rows.forEach(row => {
//             const { restaurant, menu_item, calories, protein } = row;
//             if (!restaurants[restaurant]) {
//                 restaurants[restaurant] = [];
//             }
//             restaurants[restaurant].push({
//                 menuItem: menu_item,
//                 calories: calories,
//                 protein: protein
//             });
//         });

//         res.json({ restaurants });
//     }

        

        
//     } catch (error) {
//         console.error('Error executing query', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })









// app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))





// function getCompanyNameFromLink(productLink) {
//     const url = new URL(productLink);
//     const hostname = url.hostname;

//     console.log("hostname", hostname)
//     for (const company of companies) {
//         if (hostname.includes(company.address)) {
//             return company.name;
//         }
//     }

//     return null;
// }

// // function checkForSale(productLink, companyName) {
// //     const company = companies.find(company => company.name === companyName)
// //     console.log("cfsCN", companyName);
// //     console.log("cfsPL", productLink)
    
// //     if (companyName === 'urbanOutfitters') {
// //         console.log('companyName', companyName)
// //         console.log("cfsCompanyClass", company.className)
// //         axios.get(productLink)
// //             .then(response => {
// //                 const html = response.data
// //                 const $ = cheerio.load(html)
// //             //     const priceElement = $(`span.c-pwa-product-price__current--sale`).first();
            
// //             //     if (priceElement.length === 0) {
// //             //         // Handle the case where no sale price element is found
// //             //         console.log("No sale price element found.");
// //             //         return null;
// //             //     }

// //             // const salePrice = priceElement.text().trim();
// //                 // const saleText = $(`span.${company.className}`).text().trim();
// //                 // $(`span.${company.className}`, html).text();
                
// //                 // Trial
// //                 // const salePrice = $(`span.${company.className}`).text();
// //                 console.log()
// //                 console.log('Sale Text:', salePrice);
// //                 return salePrice;
// //             })
// //     }
// // }

// function checkForSale(productLink) {
//     return axios.get(productLink)
//         .then(response => {
//             const html = response.data;
//             const $ = cheerio.load(html);

//             // This selector attempts to find HTML elements that likely contain sale prices
//             const priceSelectors = [
//                 '.c-pwa-product-price__current--sale-permanent, .c-pwa-product-price__current--sale-temporary, .sale', '.price-cut', '.discount', '.price--sale', '[class*=sale]', '[class*=discount]'
//             ];

//             let foundPrice = null;
//             $(priceSelectors.join(', ')).each((index, element) => {
//                 const text = $(element).text().trim();
//                 const ariaLabel = $(element).attr('aria-label');

//                 // Implement some heuristic to decide if this is the price you want
//                 if (text.includes('$')) {  // Simple heuristic: check if the text includes a dollar sign
//                     foundPrice = text;
//                     return false;  // stops the loop once a match is found
//                 }
//             });

//             if (foundPrice) {
//                 console.log('Found Sale Price:', foundPrice);
//                 return foundPrice;
//             } else {
//                 console.log("No sale price element found.");
//                 return null;
//             }
//         })
//         .catch(error => {
//             console.error("Failed to fetch or parse product link:", error);
//             throw error; // Re-throw to handle it in subsequent .catch()
//         });
// }

// app.get('/track', (req, res) => {
//     const productLink = req.body.productLink
//     console.log("productLink", productLink);
//     // const companyName = getCompanyNameFromLink(productLink);

//     // console.log("companyName", companyName)
//     // if (!companyName) {
//     //     return res.status(400).json({ error: 'Invalid product link' });
//     // }

//     // if (!companies.find(company => company.name === companyName)) {
//     //     return res.status(400).json({ error: 'Company not supported' });
//     // }

   
//     const isOnSale = checkForSale(productLink);
//     console.log("isOnsale", isOnSale)
//     res.json({ isOnSale });

// })

