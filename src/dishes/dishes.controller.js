const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// Middleware functions

function bodyHasName(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) {
    res.locals.name = name;
    return next();
  }
  next({ status: 400, message: `A 'name' property is required.` });
}

function bodyHasDescription(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    res.locals.description = description;
    return next();
  }
  next({ status: 400, message: `A 'description' property is required.` });
}

function bodyHasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price) {
    res.locals.price = price;
    return next();
  }
  next({ status: 400, message: `A 'price' property is required.` });
}

function bodyHasValidPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price > -1) {
    return next();
  }
  next({ status: 400, message: `price cannot be less than 0.` });
}

function bodyHasValidPriceForUpdate(req, res, next) {
  if (res.locals.price <= 0 || typeof res.locals.price !== "number") {
    next({ status: 400, message: `price must be an integer greater than $0.` });
  } else {
    return next();
  }
}

function bodyHasImg(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    res.locals.image_url = image_url;
    return next();
  }
  next({ status: 400, message: `An 'image_url' property is required.` });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const matchingDish = dishes.find((dish) => dish.id === dishId);
  if (matchingDish) {
    res.locals.matchingDish = matchingDish;
    return next();
  }
  next({ status: 404, message: `Dish id not found: ${dishId}` });
}

function dishIdMatchesDataId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const dishId = req.params.dishId;
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `ID ${id} must match dishId provided in parameters`,
    });
  }
  return next();
}

// Route handlers

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.matchingDish });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const matchingDish = res.locals.matchingDish;
  matchingDish.name = name;
  matchingDish.description = description;
  matchingDish.price = price;
  matchingDish.image_url = image_url;
  res.json({ data: matchingDish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasValidPrice,
    bodyHasImg,
    create,
  ],
  update: [
    dishExists,
    dishIdMatchesDataId,
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasImg,
    bodyHasValidPriceForUpdate,
    update,
  ],
};
