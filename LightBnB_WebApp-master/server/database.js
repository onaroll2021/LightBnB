const { Pool } = require('../node_modules/pg');
const properties = require('./json/properties.json');
const users = require('./json/users.json');

const pool = new Pool ({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE users.email = $1;`, [email])
    .then((result) => {
      return result.rows
    })
    .then((resultObj) => {
      return resultObj[0];
    })
    .catch((err) => {
      console.log("err", err.message)
      return null
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
  .query(`SELECT * FROM users WHERE users.id = $1;`, [id])
  .then((result) => {
    return result.rows
  })
  .then((resultObj) => {
    return resultObj[0];
  })
  .catch((err) => {
    console.log("err", err.message)
    return null
  });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
  .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3);`, [user.name, user.email, user.password])
  .then((result) => {
    return result.rows
  })
  .then((resultObj) => {
    return resultObj[0]
  })
  .catch((err) => {
    console.log("err", err.message)
  })
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query (`SELECT reservations.*, properties.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;`, [guest_id, limit])
    .then((result) => {
      return result.rows
    })
    .then((resultObj) => {
      console.log("resultObj[0]", resultObj[0])
      return {property: resultObj[0]}
    })
    .catch((err) => {
      console.log("err", err.message)
    })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = (options, limit = 10) => {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  queryString += `
  GROUP BY properties.id, property_reviews.rating `

  if (options.minimum_price_per_night) {
    queryParams.push(`${Number(options.minimum_price_per_night)*100}`);
    queryString += `HAVING properties.cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${Number(options.maximum_price_per_night)*100}`);
    queryString += `AND properties.cost_per_night <= $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `AND avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  console.log("QUERTSTRING", queryString)

  // 5
  // console.log(queryString, queryParams);

  // 6
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};


exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryParams = [];
  const propertyArr = Object.keys(property);
  let queryString = `INSERT INTO properties ( `
  for(let n = 0; n < Object.keys(property).length - 1; n++){
    queryString += `${propertyArr[n]}, `
  }
  queryString += `${propertyArr[propertyArr.length - 1]})`
  queryString += ` VALUES (`;
  for(let n = 0; n < Object.keys(property).length - 1; n++){
    queryParams.push(`${property[propertyArr[n]]}`)
    queryString += ` $${queryParams.length},`
  }
  queryParams.push(`${property[propertyArr[propertyArr.length - 1]]}`)
  queryString += ` $${queryParams.length}`
  queryString += `);`
  // console.log(queryString);
  return pool
  .query(queryString, queryParams)
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
};

exports.addProperty = addProperty;

